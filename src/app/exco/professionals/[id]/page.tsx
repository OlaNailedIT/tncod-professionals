import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductExcoShell } from "@/components/shell/product-exco-shell";
import { MetadataGroup, MetadataItem, StatusBadge, Surface } from "@/components/ui";
import { getAuthenticatedUser } from "@/server/auth/session";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { AppError } from "@/lib/errors";
import { hasExcoDashboardAccess } from "@/features/exco/dashboard-metrics";
import { loadExcoProfessional } from "@/features/exco/professionals/list";
import {
  businessVerificationIntent,
  businessVerificationLabel,
} from "@/features/business/verification-status";
import {
  presentProfileStatus,
  presentVerificationStatus,
  presentVisibilityStatus,
} from "@/lib/status/presentations";
import type { ProfileStatus, VerificationStatus, VisibilityStatus } from "@/types/status";
import type { BusinessStatus } from "@prisma/client";
import {
  canMutateProfessionalVerification,
  canPublishProfessionals,
  loadProfessionalVerificationHistory,
} from "@/features/professional/exco-review";
import { ExcoProfessionalReviewActions } from "@/features/professional/exco-review-actions";

function prefLabel(value: boolean | null | undefined): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not set";
}

export default async function ExcoProfessionalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const rawSearch = await searchParams;
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(
      `/sign-in?next=${encodeURIComponent(sanitizeNextPath(`/exco/professionals/${id}`))}`,
    );
  }
  if (!(await hasExcoDashboardAccess(user.userId))) {
    redirect("/dashboard");
  }

  let record;
  try {
    record = await loadExcoProfessional(user.userId, id);
  } catch (err) {
    if (err instanceof AppError && err.code === "NOT_FOUND") notFound();
    if (err instanceof AppError && err.code === "UNAUTHORIZED") redirect("/dashboard");
    throw err;
  }

  const backQs = new URLSearchParams();
  for (const [key, value] of Object.entries(rawSearch)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v) backQs.set(key, v);
  }
  const backHref = `/exco/professionals${backQs.toString() ? `?${backQs}` : ""}`;
  const fromVerification = (Array.isArray(rawSearch.from) ? rawSearch.from[0] : rawSearch.from) === "verification";
  const verificationBackTab = Array.isArray(rawSearch.tab) ? rawSearch.tab[0] : rawSearch.tab;
  const verificationBackHref = `/exco/verification${
    verificationBackTab ? `?tab=${encodeURIComponent(verificationBackTab)}` : ""
  }`;

  const [canVerify, canPublish, history] = await Promise.all([
    canMutateProfessionalVerification(user.userId),
    canPublishProfessionals(user.userId),
    loadProfessionalVerificationHistory(user.userId, id),
  ]);

  const initials = record.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <ProductExcoShell pathname="/exco/professionals" title={record.displayName}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {fromVerification ? (
              <Link href={verificationBackHref} className="underline-offset-2 hover:underline">
                Verification centre
              </Link>
            ) : (
              <Link href={backHref} className="underline-offset-2 hover:underline">
                Professionals
              </Link>
            )}
          </p>
          <div className="mt-3 flex flex-wrap items-start gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-lg font-semibold"
              aria-hidden
            >
              {initials || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold tracking-tight">{record.displayName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {[record.profession, record.industryName, record.location].filter(Boolean).join(" · ") ||
                  "Professional record"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge
                  intent={presentVerificationStatus(record.verificationStatus as VerificationStatus).intent}
                >
                  Professional: {record.verificationLabel}
                </StatusBadge>
                <StatusBadge
                  intent={presentVisibilityStatus(record.visibilityStatus as VisibilityStatus).intent}
                >
                  Directory: {record.visibilityLabel}
                </StatusBadge>
                <StatusBadge intent={presentProfileStatus(record.profileStatus as ProfileStatus).intent}>
                  Profile: {presentProfileStatus(record.profileStatus as ProfileStatus).label}
                </StatusBadge>
              </div>
            </div>
          </div>
        </div>

        <section aria-labelledby="identity-heading" className="flex flex-col gap-3">
          <h2 id="identity-heading" className="text-lg font-medium">
            Identity and profile
          </h2>
          <Surface className="p-4">
            <MetadataGroup>
              <MetadataItem label="Location">{record.location ?? "—"}</MetadataItem>
              {record.canViewContact ? (
                <>
                  <MetadataItem label="Email">{record.email ?? "—"}</MetadataItem>
                  <MetadataItem label="Phone">{record.phone ?? "—"}</MetadataItem>
                </>
              ) : (
                <MetadataItem label="Contact">
                  Restricted to EXCO Admin / Super Admin
                </MetadataItem>
              )}
              <MetadataItem label="Registered">{record.registeredAt.slice(0, 10)}</MetadataItem>
            </MetadataGroup>
            {record.bio ? <p className="mt-4 text-sm whitespace-pre-wrap">{record.bio}</p> : null}
            {record.hasHeadshot ? (
              <p className="mt-2 text-caption text-muted-foreground">
                A profile image is on file. Phase 11 shows the avatar fallback only (no storage URL
                exposure).
              </p>
            ) : null}
          </Surface>
        </section>

        <section aria-labelledby="professional-heading" className="flex flex-col gap-3">
          <h2 id="professional-heading" className="text-lg font-medium">
            Professional information
          </h2>
          <Surface className="p-4">
            <MetadataGroup>
              <MetadataItem label="Profession">{record.profession ?? "—"}</MetadataItem>
              <MetadataItem label="Industry">{record.industryName ?? "—"}</MetadataItem>
              <MetadataItem label="Organisation / workplace">{record.organisationName ?? "—"}</MetadataItem>
              <MetadataItem label="Professional situation">{record.professionalSituation ?? "—"}</MetadataItem>
              <MetadataItem label="Years of experience">{record.yearsExperience != null ? String(record.yearsExperience) : "—"}</MetadataItem>
              <MetadataItem label="LinkedIn">{record.linkedinUrl ?? "—"}</MetadataItem>
              <MetadataItem label="Website">{record.websiteUrl ?? "—"}</MetadataItem>
              <MetadataItem label="Skills">{record.skillNames.length ? record.skillNames.join(", ") : "—"}</MetadataItem>
              <MetadataItem label="Services">{record.serviceNames.length ? record.serviceNames.join(", ") : "—"}</MetadataItem>
            </MetadataGroup>
          </Surface>
        </section>

        <section aria-labelledby="opportunities-heading" className="flex flex-col gap-3">
          <h2 id="opportunities-heading" className="text-lg font-medium">
            Opportunities
          </h2>
          <Surface className="p-4">
            <MetadataGroup>
              <MetadataItem label="Seeking">{record.lookingForSummary ?? "—"}</MetadataItem>
              <MetadataItem label="Offering">{record.offeringSummary ?? "—"}</MetadataItem>
              <MetadataItem label="Collaboration">{prefLabel(record.opportunityPreferences.collaboration)}</MetadataItem>
              <MetadataItem label="Mentorship">{prefLabel(record.opportunityPreferences.mentorship)}</MetadataItem>
              <MetadataItem label="Referrals">{prefLabel(record.opportunityPreferences.referrals)}</MetadataItem>
              <MetadataItem label="Training">{prefLabel(record.opportunityPreferences.training)}</MetadataItem>
            </MetadataGroup>
          </Surface>
        </section>

        <section aria-labelledby="health-heading" className="flex flex-col gap-3">
          <h2 id="health-heading" className="text-lg font-medium">
            Profile health
          </h2>
          <Surface className="p-4">
            <p className="text-3xl font-semibold tabular-nums" data-metric-value="completion-percent">
              {record.completionPercent}%
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Phase 8 completion (informational — not verification or publication).
            </p>
            {record.needsProfessionalVerificationAttention ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Professional verification needs attention ({record.verificationLabel}).
              </p>
            ) : null}
            <ul className="mt-4 flex flex-col gap-1 text-sm">
              {record.completionSections.map((s) => (
                <li key={s.id} className="flex justify-between gap-3">
                  <span>{s.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {s.complete ? "Complete" : `${s.percent}%`}
                  </span>
                </li>
              ))}
            </ul>
          </Surface>
        </section>

        <section aria-labelledby="business-heading" className="flex flex-col gap-3">
          <h2 id="business-heading" className="text-lg font-medium">
            Business relationships
          </h2>
          {record.businesses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No linked businesses.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {record.businesses.map((b) => (
                <li key={b.id}>
                  <Surface className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Link
                        href={`/exco/businesses/${b.id}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {b.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">Role: {b.relationshipType}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        intent={businessVerificationIntent(b.businessStatus as BusinessStatus)}
                      >
                        Business: {businessVerificationLabel(b.businessStatus as BusinessStatus)}
                      </StatusBadge>
                      <StatusBadge
                        intent={presentVisibilityStatus(b.visibilityStatus as VisibilityStatus).intent}
                      >
                        Biz visibility:{" "}
                        {presentVisibilityStatus(b.visibilityStatus as VisibilityStatus).label}
                      </StatusBadge>
                    </div>
                  </Surface>
                </li>
              ))}
            </ul>
          )}
          <p className="text-caption text-muted-foreground">
            A verified business does not mean this professional is professionally verified.
          </p>
        </section>

        <section aria-labelledby="community-heading" className="flex flex-col gap-3">
          <h2 id="community-heading" className="text-lg font-medium">
            Community information
          </h2>
          <Surface className="p-4">
            <MetadataGroup>
              <MetadataItem label="Areas of service">{record.serviceArea ?? "—"}</MetadataItem>
            </MetadataGroup>
          </Surface>
        </section>

        <section aria-labelledby="verification-heading" className="flex flex-col gap-3">
          <h2 id="verification-heading" className="text-lg font-medium">
            Professional verification
          </h2>
          <Surface className="p-4">
            <p className="text-sm">
              Current professional verification: <strong>{record.verificationLabel}</strong>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Evidence below is the live stored record (not an immutable submission snapshot). Consent
              history is not fabricated when no authoritative consent write exists.
            </p>
            {record.clarificationMessage ? (
              <div className="mt-3 rounded-md border border-border p-3 text-sm">
                <p className="font-medium">Current member-facing message</p>
                <p className="mt-1">{record.clarificationMessage}</p>
              </div>
            ) : null}
          </Surface>

          <Surface className="p-4">
            <h3 className="text-base font-medium">Verification history</h3>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No verification events recorded yet.</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-3">
                {history.map((h) => (
                  <li key={h.id} className="border-b border-border-subtle pb-3 text-sm last:border-0">
                    <p className="font-medium">
                      {h.decision ?? h.processStatus}
                      {h.reviewerDisplayName ? ` · ${h.reviewerDisplayName}` : ""}
                    </p>
                    <p className="text-muted-foreground">
                      {h.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                      {h.completedAt
                        ? ` → ${h.completedAt.toISOString().slice(0, 19).replace("T", " ")}`
                        : ""}
                    </p>
                    {h.notes ? <p className="mt-1">{h.notes}</p> : null}
                  </li>
                ))}
              </ol>
            )}
          </Surface>

          <ExcoProfessionalReviewActions
            profileId={record.id}
            verificationStatus={record.verificationStatus}
            verificationLabel={record.verificationLabel}
            visibilityStatus={record.visibilityStatus}
            canVerify={canVerify}
            canPublish={canPublish}
          />
        </section>
      </div>
    </ProductExcoShell>
  );
}
