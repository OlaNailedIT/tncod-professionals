import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section, Stack } from "@/components/layout";
import { ProductMemberShell } from "@/components/shell/product-member-shell";
import { StatusBadge, Surface } from "@/components/ui";
import { requireMemberPage } from "@/server/auth/require-member";
import {
  canManageOpportunities,
  getOpportunityForMember,
} from "@/features/opportunities/commands";
import { InterestControls } from "@/features/opportunities/interest-controls";
import { CloseOpportunityButton } from "@/features/opportunities/close-button";
import {
  canViewOpportunityMatches,
  findPotentialMatches,
} from "@/features/matching/commands";
import { PotentialMatchesPanel } from "@/features/matching/matches-panel";

export const metadata: Metadata = {
  title: "Opportunity — TNCOD Professionals",
  robots: { index: false, follow: false },
};

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireMemberPage(`/opportunities/${id}`);
  const opportunity = await getOpportunityForMember(user.userId, id);
  if (!opportunity) notFound();
  const canManage = await canManageOpportunities(user.userId);
  const canViewMatches = await canViewOpportunityMatches(user.userId);
  const matchResult =
    canViewMatches && opportunity.status === "ACTIVE"
      ? await findPotentialMatches({
          actorUserId: user.userId,
          opportunityId: opportunity.id,
        })
      : canViewMatches
        ? ({
            ok: false as const,
            code: "OPPORTUNITY_CLOSED",
            message: "Only ACTIVE opportunities can be matched",
          })
        : null;

  return (
    <ProductMemberShell pathname="/opportunities" title="Opportunity">
      <Section density="member">
        <Stack gap="comfortable">
          <Link href="/opportunities" className="text-sm text-muted-foreground hover:underline">
            ← Back to opportunities
          </Link>
          <Surface className="p-5">
            <p className="text-caption uppercase tracking-wide text-muted-foreground">
              {opportunity.typeLabel}
            </p>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-h2 text-foreground">{opportunity.title}</h1>
              <StatusBadge intent={opportunity.status === "ACTIVE" ? "success" : "neutral"}>
                {opportunity.statusLabel}
              </StatusBadge>
            </div>
            {opportunity.location ? (
              <p className="mt-2 text-sm text-muted-foreground">{opportunity.location}</p>
            ) : null}
            <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">
              {opportunity.description}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Posted by TNCOD Professionals
              {opportunity.publishedAt
                ? ` · ${new Date(opportunity.publishedAt).toLocaleDateString()}`
                : ""}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <InterestControls
                opportunityId={opportunity.id}
                initiallyInterested={opportunity.interested}
                acceptsInterest={opportunity.status === "ACTIVE"}
              />
              {canManage && opportunity.status === "ACTIVE" ? (
                <CloseOpportunityButton opportunityId={opportunity.id} />
              ) : null}
            </div>
          </Surface>
          {matchResult ? <PotentialMatchesPanel result={matchResult} /> : null}
        </Stack>
      </Section>
    </ProductMemberShell>
  );
}
