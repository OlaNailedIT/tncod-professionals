import "server-only";

import { randomUUID } from "crypto";
import type { DocumentType } from "@prisma/client";
import { getPrisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/server/audit/write-audit";
import { requirePermission } from "@/server/authorization/require";
import { PERMISSIONS } from "@/security/permissions";
import { assertBusinessAssociation } from "@/features/business/own-business";
import {
  ALLOWED_BUSINESS_DOCUMENT_TYPES,
  ALLOWED_DOCUMENT_MIME,
  MAX_BUSINESS_DOCUMENT_BYTES,
  extensionForFileName,
  sniffDocumentMime,
  type AllowedBusinessDocumentType,
} from "@/features/business/business-schema";

export const MEMBER_DOCUMENTS_BUCKET = "member-documents";

export type BusinessDocumentView = {
  id: string;
  documentType: DocumentType;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
  status: string;
};

function buildStorageKey(userId: string, documentId: string): string {
  // Path convention: documents/{auth.uid()}/{document_id} — never client-supplied.
  return `documents/${userId}/${documentId}`;
}

export async function listBusinessDocumentsForMember(
  authUserId: string,
  businessId: string,
): Promise<BusinessDocumentView[]> {
  await assertBusinessAssociation(authUserId, businessId);
  const prisma = getPrisma();
  const rows = await prisma.document.findMany({
    where: { businessId },
    orderBy: { uploadedAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    documentType: r.documentType,
    fileName: r.fileName,
    mimeType: r.mimeType,
    fileSize: r.fileSize,
    uploadedAt: r.uploadedAt.toISOString(),
    status: r.status,
  }));
}

export async function listBusinessDocumentsForExco(
  reviewerUserId: string,
  businessId: string,
): Promise<BusinessDocumentView[]> {
  await requirePermission(reviewerUserId, PERMISSIONS.DOCUMENT_REVIEW);
  const prisma = getPrisma();
  const rows = await prisma.document.findMany({
    where: { businessId },
    orderBy: { uploadedAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    documentType: r.documentType,
    fileName: r.fileName,
    mimeType: r.mimeType,
    fileSize: r.fileSize,
    uploadedAt: r.uploadedAt.toISOString(),
    status: r.status,
  }));
}

export async function uploadBusinessDocument(input: {
  authUserId: string;
  businessId: string;
  documentType: string;
  fileName: string;
  bytes: Uint8Array;
  claimedMimeType: string;
}): Promise<{ ok: true; documentId: string } | { ok: false; message: string }> {
  const { profileId } = await assertBusinessAssociation(input.authUserId, input.businessId);

  if (!ALLOWED_BUSINESS_DOCUMENT_TYPES.includes(input.documentType as AllowedBusinessDocumentType)) {
    return { ok: false, message: "Unsupported document type." };
  }

  if (!input.bytes.length) {
    return { ok: false, message: "File is empty." };
  }
  if (input.bytes.length > MAX_BUSINESS_DOCUMENT_BYTES) {
    return { ok: false, message: "File is too large (max 10 MB)." };
  }

  const sniffed = sniffDocumentMime(input.bytes);
  if (!sniffed) {
    return { ok: false, message: "Unrecognised file type. Upload PDF, PNG, or JPEG only." };
  }
  const allowedExt = ALLOWED_DOCUMENT_MIME[sniffed];
  const ext = extensionForFileName(input.fileName);
  if (!allowedExt || !allowedExt.includes(ext)) {
    return { ok: false, message: "File extension does not match allowed types." };
  }
  // Prefer sniffed type over browser claim.
  const mimeType = sniffed;

  const prisma = getPrisma();
  const documentId = randomUUID();
  const storageKey = buildStorageKey(input.authUserId, documentId);

  const admin = createServiceRoleClient();
  const { error: uploadError } = await admin.storage
    .from(MEMBER_DOCUMENTS_BUCKET)
    .upload(storageKey, input.bytes, {
      contentType: mimeType,
      upsert: false,
    });
  if (uploadError) {
    return { ok: false, message: `Storage upload failed: ${uploadError.message}` };
  }

  try {
    await prisma.document.create({
      data: {
        id: documentId,
        profileId,
        businessId: input.businessId,
        documentType: input.documentType as DocumentType,
        storageKey,
        fileName: input.fileName.slice(0, 200),
        mimeType,
        fileSize: input.bytes.length,
        status: "UPLOADED",
      },
    });
  } catch (err) {
    await admin.storage.from(MEMBER_DOCUMENTS_BUCKET).remove([storageKey]);
    throw err;
  }

  await writeAuditLog({
    actorId: input.authUserId,
    action: "business.document.upload",
    entityType: "document",
    entityId: documentId,
    metadata: {
      businessId: input.businessId,
      documentType: input.documentType,
      mimeType,
      fileSize: input.bytes.length,
      storageKey,
    },
  });

  return { ok: true, documentId };
}

async function authorizeDocumentAccess(
  actorUserId: string,
  documentId: string,
): Promise<{ storageKey: string; fileName: string; mimeType: string }> {
  const prisma = getPrisma();
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) {
    throw new AppError("NOT_FOUND", "Document not found");
  }

  const owner = await prisma.profile.findFirst({
    where: { id: doc.profileId, userId: actorUserId, deletedAt: null },
    select: { id: true },
  });
  if (owner) {
    return { storageKey: doc.storageKey, fileName: doc.fileName, mimeType: doc.mimeType };
  }

  // EXCO reviewer path
  try {
    await requirePermission(actorUserId, PERMISSIONS.DOCUMENT_REVIEW);
    return { storageKey: doc.storageKey, fileName: doc.fileName, mimeType: doc.mimeType };
  } catch {
    throw new AppError("UNAUTHORIZED", "Document access denied");
  }
}

/** Short-lived signed URL — never permanent public URLs. */
export async function createAuthorizedDocumentSignedUrl(
  actorUserId: string,
  documentId: string,
  expiresInSeconds = 60,
): Promise<{ url: string; fileName: string; mimeType: string }> {
  const meta = await authorizeDocumentAccess(actorUserId, documentId);
  // Reject path traversal / client path injection by only using DB storageKey.
  if (
    meta.storageKey.includes("..") ||
    !meta.storageKey.startsWith("documents/") ||
    meta.storageKey.split("/").length !== 3
  ) {
    throw new AppError("INTERNAL", "Invalid storage key");
  }

  const admin = createServiceRoleClient();
  const { data, error } = await admin.storage
    .from(MEMBER_DOCUMENTS_BUCKET)
    .createSignedUrl(meta.storageKey, expiresInSeconds);
  if (error || !data?.signedUrl) {
    throw new AppError("INTERNAL", error?.message ?? "Could not create signed URL");
  }
  return { url: data.signedUrl, fileName: meta.fileName, mimeType: meta.mimeType };
}
