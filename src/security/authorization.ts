/**
 * Domain authorization helpers. These do not talk to the database.
 * Phase 4 must call them with identity derived from Auth, not the request body.
 *
 * assertTrustedUserId binds the caller to auth.uid(). It is NOT an authorization
 * decision (SEC-001 still requires ownership + permission checks).
 */
import { PERMISSIONS, type AppRoleName, type PermissionKey } from "./permissions";

export const PRIVILEGED_PROFILE_FIELDS = [
  "verificationStatus",
  "verification_status",
] as const;

export const MEMBER_PROFILE_CONTENT_FIELDS = [
  "displayName",
  "headline",
  "bio",
  "location",
  "professionalSituation",
] as const;

export function denyByDefault(): never {
  throw new Error("AUTHORIZATION_DENIED");
}

export function hasPermission(
  granted: readonly PermissionKey[],
  required: PermissionKey,
): boolean {
  return granted.includes(required);
}

export function canVerifyProfessionals(granted: readonly PermissionKey[]): boolean {
  return hasPermission(granted, PERMISSIONS.PROFESSIONAL_VERIFY);
}

export function canPublishProfessionals(granted: readonly PermissionKey[]): boolean {
  return hasPermission(granted, PERMISSIONS.PROFESSIONAL_PUBLISH);
}

export function canManageRoles(granted: readonly PermissionKey[]): boolean {
  return hasPermission(granted, PERMISSIONS.USER_MANAGE_ROLES);
}

export function canManageConfiguration(granted: readonly PermissionKey[]): boolean {
  return hasPermission(granted, PERMISSIONS.CONFIGURATION_MANAGE);
}

/** Identity binding only. Does not grant access to any resource. */
export function assertTrustedUserId(
  authUserId: string | null | undefined,
  claimedUserId?: string | null,
): string {
  if (!authUserId) {
    throw new Error("UNAUTHENTICATED");
  }
  if (claimedUserId && claimedUserId !== authUserId) {
    throw new Error("AUTHORIZATION_DENIED");
  }
  return authUserId;
}

export function memberPatchDeniedFields(fields: readonly string[]): string[] {
  return fields.filter((f) =>
    (PRIVILEGED_PROFILE_FIELDS as readonly string[]).includes(f),
  );
}

export function memberMayPatchProfileFields(fields: readonly string[]): {
  ok: boolean;
  denied: string[];
} {
  const denied = memberPatchDeniedFields(fields);
  return { ok: denied.length === 0, denied };
}

export function memberMaySetVisibilityPreference(
  next: VisibilityStatus | null | undefined,
): boolean {
  return next === "PRIVATE" || next === "MEMBERS_ONLY";
}

/**
 * Escalation through request body / client role is always denied.
 * Only SUPER_ADMIN + user.manage_roles may change privileged roles (Phase 4).
 */
export function clientMayAssignRole(_from: AppRoleName, _to: AppRoleName): false {
  return false;
}

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export function accountMayUseApplication(status: AccountStatus): boolean {
  return status === "ACTIVE";
}

export type VerificationStatus =
  | "NOT_REVIEWED"
  | "PENDING"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "NEEDS_CLARIFICATION"
  | "REJECTED";

export type VisibilityStatus = "PRIVATE" | "MEMBERS_ONLY" | "DIRECTORY";

export function directoryListingAllowed(
  verification: VerificationStatus,
  visibility: VisibilityStatus,
): boolean {
  return visibility === "DIRECTORY" && verification === "VERIFIED";
}

const ADMIN_VERIFICATION_TRANSITIONS: Record<
  VerificationStatus,
  readonly VerificationStatus[]
> = {
  NOT_REVIEWED: ["PENDING", "UNDER_REVIEW"],
  PENDING: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["VERIFIED", "NEEDS_CLARIFICATION", "REJECTED"],
  VERIFIED: [],
  NEEDS_CLARIFICATION: ["PENDING", "UNDER_REVIEW"],
  REJECTED: ["PENDING"],
};

export function memberMaySetVerification(
  _from: VerificationStatus,
  _to: VerificationStatus,
): boolean {
  return false;
}

export function adminMaySetVerification(
  from: VerificationStatus,
  to: VerificationStatus,
): boolean {
  return ADMIN_VERIFICATION_TRANSITIONS[from].includes(to);
}

export function memberMaySetDirectoryVisibility(): boolean {
  return false;
}
