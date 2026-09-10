/**
 * Canonical permission keys. Must stay aligned with prisma/seed.ts PERMISSIONS
 * and docs/security/permission-matrix.md.
 *
 * Catalogue only — not authorization. Callers must still check server/DB context.
 */
export const PERMISSIONS = {
  PROFESSIONAL_VIEW: "professional.view",
  PROFESSIONAL_EDIT: "professional.edit",
  PROFESSIONAL_VERIFY: "professional.verify",
  PROFESSIONAL_PUBLISH: "professional.publish",
  BUSINESS_VIEW: "business.view",
  BUSINESS_MANAGE: "business.manage",
  BUSINESS_VERIFY: "business.verify",
  BUSINESS_PUBLISH: "business.publish",
  OPPORTUNITY_VIEW: "opportunity.view",
  OPPORTUNITY_MANAGE: "opportunity.manage",
  DOCUMENT_VIEW: "document.view",
  DOCUMENT_REVIEW: "document.review",
  SPOTLIGHT_MANAGE: "spotlight.manage",
  USER_MANAGE: "user.manage",
  USER_MANAGE_ROLES: "user.manage_roles",
  AUDIT_VIEW: "audit.view",
  CONFIGURATION_MANAGE: "configuration.manage",
  REPORT_VIEW: "report.view",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSION_KEYS: readonly PermissionKey[] = Object.values(PERMISSIONS);

/** Instruction aliases → catalogue keys. Do not insert these as extra DB rows. */
export const PERMISSION_ALIASES: Record<string, PermissionKey | "domain" | "ownership"> = {
  "profile.view.own": PERMISSIONS.PROFESSIONAL_VIEW,
  "profile.edit.own": PERMISSIONS.PROFESSIONAL_EDIT,
  "profile.create": "ownership",
  "profile.submit": "domain",
  "profile.view.directory": PERMISSIONS.PROFESSIONAL_VIEW,
  "profile.view.internal": PERMISSIONS.PROFESSIONAL_VIEW,
  "profile.verify": PERMISSIONS.PROFESSIONAL_VERIFY,
  "profile.reject": PERMISSIONS.PROFESSIONAL_VERIFY,
  "profile.request_clarification": PERMISSIONS.PROFESSIONAL_VERIFY,
  "profile.publish": PERMISSIONS.PROFESSIONAL_PUBLISH,
  "profile.unpublish": PERMISSIONS.PROFESSIONAL_PUBLISH,
  "business.view.own": PERMISSIONS.BUSINESS_VIEW,
  "business.manage.own": PERMISSIONS.BUSINESS_MANAGE,
  "business.view.internal": PERMISSIONS.BUSINESS_VIEW,
  "document.upload.own": PERMISSIONS.DOCUMENT_VIEW,
  "document.view.own": PERMISSIONS.DOCUMENT_VIEW,
  "document.view.internal": PERMISSIONS.DOCUMENT_REVIEW,
  "verification.view": PERMISSIONS.PROFESSIONAL_VERIFY,
  "verification.manage": PERMISSIONS.PROFESSIONAL_VERIFY,
  "admin_note.view": "domain",
  "admin_note.create": "domain",
  "spotlight.view": PERMISSIONS.SPOTLIGHT_MANAGE,
  "consent.view.own": "ownership",
  "consent.manage.own": "ownership",
  "notification.view.own": "ownership",
  "role.manage": PERMISSIONS.USER_MANAGE_ROLES,
  "permission.manage": PERMISSIONS.USER_MANAGE_ROLES,
};

export const ROLES = {
  MEMBER: "MEMBER",
  EXCO_VIEWER: "EXCO_VIEWER",
  EXCO_ADMIN: "EXCO_ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type AppRoleName = (typeof ROLES)[keyof typeof ROLES];

/** Default grants for seed / documentation. Additive at runtime via user_roles. */
export const ROLE_PERMISSION_KEYS: Record<AppRoleName, readonly PermissionKey[]> = {
  MEMBER: [
    PERMISSIONS.PROFESSIONAL_VIEW,
    PERMISSIONS.PROFESSIONAL_EDIT,
    PERMISSIONS.BUSINESS_VIEW,
    PERMISSIONS.BUSINESS_MANAGE,
    PERMISSIONS.OPPORTUNITY_VIEW,
    PERMISSIONS.DOCUMENT_VIEW,
  ],
  EXCO_VIEWER: [
    PERMISSIONS.PROFESSIONAL_VIEW,
    PERMISSIONS.BUSINESS_VIEW,
    PERMISSIONS.OPPORTUNITY_VIEW,
    PERMISSIONS.REPORT_VIEW,
  ],
  EXCO_ADMIN: [
    PERMISSIONS.PROFESSIONAL_VIEW,
    PERMISSIONS.PROFESSIONAL_VERIFY,
    PERMISSIONS.PROFESSIONAL_PUBLISH,
    PERMISSIONS.BUSINESS_VIEW,
    PERMISSIONS.BUSINESS_MANAGE,
    PERMISSIONS.BUSINESS_VERIFY,
    PERMISSIONS.BUSINESS_PUBLISH,
    PERMISSIONS.OPPORTUNITY_VIEW,
    PERMISSIONS.OPPORTUNITY_MANAGE,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_REVIEW,
    PERMISSIONS.SPOTLIGHT_MANAGE,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.REPORT_VIEW,
  ],
  SUPER_ADMIN: ALL_PERMISSION_KEYS,
};
