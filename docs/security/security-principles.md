# Security and privacy principles

**Status:** Principles locked (Phase 0). Detailed contract: **Phase 3** (`docs/security/security-architecture.md`).  
**Auth implementation:** Phase 4+  
**RLS applied:** not yet (database gate)

Do not treat frontend checks as authorization.

Field-by-field visibility: `docs/security/data-visibility-matrix.md` (extends Phase 2 `docs/data/data-classification.md`).

---

## Core privacy principle

The system must distinguish:

1. Information **collected**
2. Information visible to the **member** (own record)
3. Information visible to **EXCO** (by role)
4. Information visible to **authenticated members**
5. Information **published** in the directory
6. **Sensitive** information that must remain private

**COLLECTION ≠ PUBLICATION**

Directory publication is opt-in/controlled, not automatic.

---

## Hybrid directory (access layers)

| Layer | Intent |
| --- | --- |
| Private | EXCO operational data; documents; verification records; admin notes; sensitive contacts |
| Members-only | Richer professional information, contact options, services, collaboration — where permitted |
| Public | Limited approved presence: name, profession, category, general location, approved summary |

Sensitive information must never be exposed merely because it exists in the database.

Likely sensitive (not exhaustive):

- Personal contact details
- Uploaded documents, CVs, CAC certificates
- Verification records and evidence
- EXCO notes
- Internal operational history

**OPEN DECISION (Phase 1 / 13):** Field-by-field classification matrix.

---

## Authentication principles

- **Record-first:** registration must not require password creation.
- **Secure later access:** passwordless (magic link and/or OTP). Exact mechanism is Phase 7.
- **No insecure long-term secret URLs** as the access-control model for a person’s record.
- EXCO authentication is separate from member registration friction; staff still authenticate (Phase 10).
- Roles: Member, EXCO Viewer, EXCO Admin, Super Admin — least privilege in Phase 3.

---

## Verification vs display

- Self-asserted professional claims are not verified credentials.
- UI and APIs must not emit a verified badge unless EXCO has completed the appropriate review.
- Profile review ticks and credential verification ticks are different meanings; do not conflate them.

---

## Auditability

Important state changes (verification decisions, directory visibility changes, and similar operational actions) must be auditable. Mechanism (tables, logs) is Phase 2–3.

---

## What Phase 3 added

Contract (not applied runtime): RLS/storage design, permission matrix, threat model, API authorization, authentication boundary, security tests defined. See `phase-3-security-gate.md`.
