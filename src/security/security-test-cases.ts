/**
 * Negative-test catalogue for Phase 4+. Not executed in Phase 3.
 */
export type ExpectedDenial = "401" | "403" | "empty" | "rls" | "validation";

export interface SecurityTestCase {
  id: string;
  group: string;
  actor: string;
  action: string;
  expected: ExpectedDenial;
}

export const SECURITY_TEST_CASES: readonly SecurityTestCase[] = [
  { id: "auth-anon-profile", group: "authentication", actor: "anonymous", action: "GET own profile", expected: "401" },
  { id: "auth-expired", group: "authentication", actor: "expired session", action: "GET protected", expected: "401" },
  { id: "auth-suspended", group: "authentication", actor: "SUSPENDED", action: "PATCH profile", expected: "403" },
  { id: "auth-deactivated", group: "authentication", actor: "DEACTIVATED", action: "PATCH profile", expected: "403" },
  { id: "idor-profile", group: "ownership", actor: "member-a", action: "GET member-b private profile", expected: "empty" },
  { id: "idor-document", group: "ownership", actor: "member-a", action: "GET member-b document", expected: "403" },
  { id: "idor-opportunity", group: "ownership", actor: "member-a", action: "GET member-b private opportunity", expected: "empty" },
  { id: "idor-patch-profile", group: "ownership", actor: "member-a", action: "PATCH member-b profile", expected: "403" },
  { id: "idor-business", group: "ownership", actor: "member-a", action: "PATCH member-b business", expected: "403" },
  { id: "idor-consent", group: "ownership", actor: "member-a", action: "GET member-b consents", expected: "403" },
  { id: "viewer-notes", group: "roles", actor: "exco-viewer", action: "GET admin notes", expected: "403" },
  { id: "member-verify", group: "roles", actor: "member", action: "verify profile", expected: "403" },
  { id: "member-publish", group: "roles", actor: "member", action: "set visibility DIRECTORY", expected: "403" },
  { id: "viewer-verify", group: "roles", actor: "exco-viewer", action: "verify", expected: "403" },
  { id: "viewer-publish", group: "roles", actor: "exco-viewer", action: "publish", expected: "403" },
  { id: "admin-roles", group: "roles", actor: "exco-admin", action: "manage SUPER_ADMIN", expected: "403" },
  { id: "admin-config", group: "roles", actor: "exco-admin", action: "configuration.manage", expected: "403" },
  { id: "anon-email", group: "sensitive", actor: "anonymous", action: "read email", expected: "empty" },
  { id: "anon-phone", group: "sensitive", actor: "anonymous", action: "read phone", expected: "empty" },
  { id: "anon-cv", group: "sensitive", actor: "anonymous", action: "read CV", expected: "403" },
  { id: "anon-church", group: "sensitive", actor: "anonymous", action: "read church_information", expected: "empty" },
  { id: "anon-vnotes", group: "sensitive", actor: "anonymous", action: "read verification notes", expected: "403" },
  { id: "anon-anotes", group: "sensitive", actor: "anonymous", action: "read admin notes", expected: "403" },
  { id: "search-private", group: "privacy", actor: "anonymous", action: "search private profile name", expected: "empty" },
  { id: "spoof-userid", group: "authorization", actor: "member-a", action: "body userId of member-b", expected: "403" },
  { id: "spoof-role", group: "authorization", actor: "member", action: "client role EXCO_ADMIN", expected: "403" },
  { id: "member-roles", group: "roles", actor: "member", action: "assign EXCO_VIEWER", expected: "403" },
  { id: "viewer-delete", group: "rls", actor: "exco-viewer", action: "DELETE professional_details", expected: "rls" },
  { id: "viewer-email", group: "privacy", actor: "exco-viewer", action: "SELECT users.email all members", expected: "rls" },
  { id: "anon-storage", group: "storage", actor: "anonymous", action: "GET storage object", expected: "403" },
  { id: "wf-self-verify", group: "workflow", actor: "member", action: "set verification VERIFIED", expected: "validation" },
  { id: "wf-illegal-admin", group: "workflow", actor: "exco-admin", action: "PENDING → VERIFIED skip UNDER_REVIEW", expected: "validation" },
];
