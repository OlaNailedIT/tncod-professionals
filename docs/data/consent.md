# Consent (Phase 2)

Consent is an **append-style history**, not a single mutable boolean. Rows: `consent_type`, `version` (policy), `granted`, `granted_at`, `withdrawn_at`, `user_id`. Do not overwrite past grants; withdraw by setting `withdrawn_at` (or inserting a withdrawal fact on the same row).

## V1 catalogue

| Type | Mandatory? | On withdraw |
| --- | --- | --- |
| `DATA_PROCESSING` | Required to operate the service (legal copy OPEN) | Account/use policy OPEN (Phase 3/legal) |
| `DIRECTORY_VISIBILITY` | Optional for public listing | Must not remain DIRECTORY; service unpublishes to MEMBERS_ONLY or PRIVATE |
| `COMMUNICATION` | Optional | Stop non-essential comms |

Not legal advice. Exact policy text and mandatory set: legal review before production.

No consent UI in Phase 2. Enforcement: Phase 3.
