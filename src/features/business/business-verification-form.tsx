"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Field,
  FormActions,
  FormSection,
  Input,
  Select,
  StatusBadge,
} from "@/components/ui";
import {
  submitBusinessVerificationAction,
  uploadBusinessDocumentAction,
} from "@/features/business/actions";
import {
  businessVerificationIntent,
  memberMaySubmit,
} from "@/features/business/verification-status";
import type { BusinessStatus } from "@prisma/client";
import type { BusinessDocumentView } from "@/features/business/business-documents";

export function BusinessVerificationForm({
  businessId,
  businessStatus,
  verificationLabel,
  clarificationMessage,
  cacRegistered,
  cacNumber,
  documents,
}: {
  businessId: string;
  businessStatus: BusinessStatus;
  verificationLabel: string;
  clarificationMessage: string | null;
  cacRegistered: boolean | null;
  cacNumber: string | null;
  documents: BusinessDocumentView[];
}) {
  const router = useRouter();
  const [cacFlag, setCacFlag] = React.useState<"yes" | "no" | "unset">(
    cacRegistered === true ? "yes" : cacRegistered === false ? "no" : "unset",
  );
  const [cacNum, setCacNum] = React.useState(cacNumber ?? "");
  const [docType, setDocType] = React.useState("BUSINESS_REGISTRATION");
  const [file, setFile] = React.useState<File | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const canSubmit = memberMaySubmit(businessStatus);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.set("businessId", businessId);
      fd.set("documentType", docType);
      fd.set("file", file);
      const result = await uploadBusinessDocumentAction(fd);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage("Document uploaded.");
      setFile(null);
      router.refresh();
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await submitBusinessVerificationAction(businessId, {
        cacRegistered: cacFlag,
        cacNumber: cacNum,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage("Submitted for verification.");
      router.refresh();
    } catch {
      setError("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge intent={businessVerificationIntent(businessStatus)}>
          {verificationLabel}
        </StatusBadge>
        <p className="text-sm text-muted-foreground">
          Business verification is separate from professional verification and directory publication.
        </p>
      </div>

      {clarificationMessage ? (
        <Alert intent="warning" title="Action needed">
          {clarificationMessage}
        </Alert>
      ) : null}

      {error ? (
        <Alert intent="danger" title="Could not continue">
          {error}
        </Alert>
      ) : null}
      {message ? (
        <Alert intent="success" title="Saved">
          {message}
        </Alert>
      ) : null}

      <FormSection
        title="Verification information"
        description="CAC details are member-supplied evidence. They do not mean the business is verified until EXCO completes review."
      >
        <Field label="Registered with CAC?">
          <Select
            value={cacFlag}
            onChange={(e) => setCacFlag(e.target.value as "yes" | "no" | "unset")}
            disabled={!canSubmit}
          >
            <option value="unset">Not set</option>
            <option value="yes">Yes — member claim</option>
            <option value="no">No</option>
          </Select>
        </Field>
        <Field
          label="CAC number"
          description="Accepted as supplied evidence only. No external CAC API check in Phase 9."
        >
          <Input
            value={cacNum}
            onChange={(e) => setCacNum(e.target.value)}
            disabled={!canSubmit}
            autoComplete="off"
          />
        </Field>
      </FormSection>

      <FormSection title="Documents" description="Private verification evidence (PDF, PNG, or JPEG).">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {documents.length === 0 ? <li>No documents uploaded yet.</li> : null}
          {documents.map((d) => (
            <li key={d.id}>
              {d.fileName} · {d.documentType} · {(d.fileSize / 1024).toFixed(0)} KB
            </li>
          ))}
        </ul>
        {canSubmit ? (
          <form onSubmit={onUpload} className="mt-4 flex flex-col gap-3">
            <Field label="Document type">
              <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
                <option value="BUSINESS_REGISTRATION">CAC / business registration</option>
                <option value="PROFESSIONAL_CERTIFICATE">Credential / certificate</option>
                <option value="OTHER">Other evidence</option>
              </Select>
            </Field>
            <Field label="File">
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Field>
            <Button type="submit" variant="secondary" disabled={uploading || submitting}>
              {uploading ? "Uploading…" : "Upload document"}
            </Button>
          </form>
        ) : null}
      </FormSection>

      {canSubmit ? (
        <form onSubmit={onSubmit}>
          <FormActions>
            <Button type="submit" disabled={uploading || submitting}>
              {submitting
                ? "Submitting…"
                : businessStatus === "DRAFT"
                  ? "Submit for verification"
                  : "Resubmit for verification"}
            </Button>
          </FormActions>
        </form>
      ) : (
        <Alert intent="info" title="Review in progress">
          You cannot change verification while the status is “{verificationLabel}”.
        </Alert>
      )}
    </div>
  );
}
