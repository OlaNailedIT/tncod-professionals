import type { OwnMemberProfile } from "@/features/profile/own-profile";
import { memberMaySubmitVerification } from "@/features/professional/verification-status";
import type { VerificationStatus } from "@prisma/client";

export type MemberNextAction = {
  title: string;
  body: string;
  href: string;
  cta: string;
};

/** Secondary dashboard destinations — always existing member routes. */
export const DASHBOARD_SECONDARY_LINKS = [
  { href: "/opportunities", label: "Explore opportunities" },
  { href: "/profile", label: "View profile" },
  { href: "/settings/privacy", label: "Privacy settings" },
] as const;

function remainingSectionTitles(profile: OwnMemberProfile): string {
  const remaining = profile.completion.sections
    .filter((section) => section.ratio < 1)
    .map((section) => section.title);
  if (remaining.length === 0) return "";
  if (remaining.length === 1) return remaining[0]!;
  if (remaining.length === 2) return `${remaining[0]} and ${remaining[1]}`;
  return `${remaining.slice(0, -1).join(", ")}, and ${remaining[remaining.length - 1]}`;
}

/**
 * Presentation-only next-best-action from existing capabilities.
 * Does not invent product features or falsify status.
 * PENDING ≠ UNDER_REVIEW. Directory listing = VERIFIED ∧ DIRECTORY only.
 */
export function resolveMemberNextAction(
  profile: OwnMemberProfile | null,
): MemberNextAction {
  if (!profile) {
    return {
      title: "We could not find your profile",
      body: "Your account is signed in, but your profile is missing. Try refreshing, or contact support if this continues.",
      href: "/profile",
      cta: "Open profile",
    };
  }

  const percent = profile.completion.percent;
  const verification = profile.verificationStatus as VerificationStatus;
  const visibility = profile.visibilityStatus;
  const clarification = profile.clarificationMessage?.trim();

  if (verification === "NEEDS_CLARIFICATION") {
    const detail = clarification
      ? ` ${clarification}`
      : " Open your profile to see what was requested and update your information.";
    return {
      title: "EXCO needs clarification",
      body: `EXCO asked for more information before verification can continue.${detail}`,
      href: "/profile",
      cta: "Open profile",
    };
  }

  if (verification === "REJECTED") {
    const detail = clarification
      ? ` ${clarification}`
      : " Open your profile to review the decision, correct your information, and resubmit when ready.";
    return {
      title: "Verification was not approved",
      body: `Your profile was not verified.${detail}`,
      href: "/profile",
      cta: "Review and update",
    };
  }

  if (percent < 100) {
    const remaining = remainingSectionTitles(profile);
    return {
      title: "Complete your profile",
      body: remaining
        ? `Your profile is ${percent}% complete. Still to finish: ${remaining}. Completing these helps people understand what you do — it does not verify or publish you.`
        : `Your profile is ${percent}% complete. Finish the remaining details so your professional record is ready when you want review.`,
      href: "/profile/edit",
      cta: "Continue profile",
    };
  }

  if (memberMaySubmitVerification(verification)) {
    return {
      title: "Ready to submit for review",
      body: "Your profile looks complete. Submitting asks EXCO to review it for verification. That is separate from appearing in the directory.",
      href: "/profile",
      cta: "Review and submit",
    };
  }

  if (verification === "PENDING") {
    return {
      title: "Your profile is awaiting review",
      body: "Your submission is waiting for EXCO review. We’ll show any clarification request on your profile.",
      href: "/opportunities",
      cta: "Explore opportunities",
    };
  }

  if (verification === "UNDER_REVIEW") {
    return {
      title: "EXCO is reviewing your profile",
      body: "Your profile is under active review. Nothing else is required from you right now. Any clarification request will appear on your profile.",
      href: "/opportunities",
      cta: "Explore opportunities",
    };
  }

  if (verification === "VERIFIED" && visibility === "DIRECTORY") {
    return {
      title: "You are listed in the directory",
      body: "Your published profile can appear in the professionals directory. Review privacy preferences anytime, or explore opportunities.",
      href: "/professionals",
      cta: "Open directory",
    };
  }

  if (verification === "VERIFIED") {
    return {
      title: "You are verified",
      body: "Your professional verification is complete. Appearing in the directory is a separate EXCO publication step — a Public directory preference does not publish you by itself.",
      href: "/opportunities",
      cta: "Explore opportunities",
    };
  }

  return {
    title: "Explore the community",
    body: "Browse opportunities and keep your profile up to date.",
    href: "/opportunities",
    cta: "Explore opportunities",
  };
}
