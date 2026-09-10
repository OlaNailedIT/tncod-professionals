"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/server/auth/session";
import {
  createOwnBusiness,
  submitOwnBusinessVerification,
  updateOwnBusiness,
} from "@/features/business/own-business";
import { applyExcoBusinessDecision } from "@/features/business/exco-business";
import type { ExcoBusinessAction } from "@/features/business/verification-status";
import { uploadBusinessDocument } from "@/features/business/business-documents";

function revalidateBusinessPaths(businessId?: string) {
  revalidatePath("/businesses");
  revalidatePath("/profile");
  revalidatePath("/exco/businesses");
  if (businessId) {
    revalidatePath(`/businesses/${businessId}`);
    revalidatePath(`/businesses/${businessId}/edit`);
    revalidatePath(`/businesses/${businessId}/verification`);
    revalidatePath(`/exco/businesses/${businessId}`);
  }
}

export async function createBusinessAction(raw: unknown) {
  const user = await requireAuthenticatedUser();
  const result = await createOwnBusiness(user.userId, raw);
  if (result.ok) {
    revalidateBusinessPaths(result.businessId);
  }
  return result;
}

export async function updateBusinessAction(businessId: string, raw: unknown) {
  const user = await requireAuthenticatedUser();
  const result = await updateOwnBusiness(user.userId, businessId, raw);
  if (result.ok) {
    revalidateBusinessPaths(businessId);
  }
  return result;
}

export async function submitBusinessVerificationAction(businessId: string, raw: unknown) {
  const user = await requireAuthenticatedUser();
  const result = await submitOwnBusinessVerification(user.userId, businessId, raw);
  if (result.ok) {
    revalidateBusinessPaths(businessId);
  }
  return result;
}

export async function uploadBusinessDocumentAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const businessId = String(formData.get("businessId") ?? "");
  const documentType = String(formData.get("documentType") ?? "");
  const file = formData.get("file");
  if (!businessId || !(file instanceof File)) {
    return { ok: false as const, message: "Business and file are required." };
  }
  const buffer = new Uint8Array(await file.arrayBuffer());
  const result = await uploadBusinessDocument({
    authUserId: user.userId,
    businessId,
    documentType,
    fileName: file.name,
    bytes: buffer,
    claimedMimeType: file.type,
  });
  if (result.ok) {
    revalidateBusinessPaths(businessId);
  }
  return result;
}

export async function excoBusinessDecisionAction(input: {
  businessId: string;
  action: ExcoBusinessAction;
  memberFacingMessage?: string;
  internalNote?: string;
}) {
  const user = await requireAuthenticatedUser();
  const result = await applyExcoBusinessDecision({
    reviewerUserId: user.userId,
    businessId: input.businessId,
    action: input.action,
    memberFacingMessage: input.memberFacingMessage,
    internalNote: input.internalNote,
  });
  if (result.ok) {
    revalidateBusinessPaths(input.businessId);
  }
  return result;
}
