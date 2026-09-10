# API security contract (design — endpoints not implemented)

Generic `PATCH /profiles/:id` that accepts privileged fields is **forbidden**.

Content updates use an **allowlist** (member-controlled fields). Visibility preference may be `PRIVATE` | `MEMBERS_ONLY` only. DIRECTORY / verification / notes / audit are domain commands.

Anonymous: directory search/get `PublicProfessional`; register; sign-in. Never private profiles, documents, notes, verification records, consents, audit.

Search uses the **same** DIRECTORY+VERIFIED filter and the same projection as GET. Authenticated members do not receive global private-profile search.

| Command / conceptual endpoint | Auth | Permission / ownership | Transition | Projection | Audit |
| --- | --- | --- | --- | --- | --- |
| `GET /professionals/:slug` | Anon OK | DIRECTORY+VERIFIED | — | PublicProfessional | No |
| `GET /professionals` search | Anon OK | Same filter | — | PublicProfessional | Rate TBD |
| `GET /profile` | Member | Own | — | MemberProfessional | No |
| Content update (allowlist) | Member | Own + `professional.edit` | No verify/DIRECTORY | MemberProfessional | PROFILE_UPDATED |
| `submitProfile` | Member | Own | → SUBMITTED / PENDING | Member | PROFILE_SUBMITTED |
| `verifyProfile` | Admin | `professional.verify` | Legal graph | ExcoAdmin | VERIFICATION_APPROVED |
| `requestClarification` | Admin | `professional.verify` | → NEEDS_CLARIFICATION | ExcoAdmin | VERIFICATION_NEEDS_CLARIFICATION |
| `rejectProfile` | Admin | `professional.verify` | → REJECTED | ExcoAdmin | VERIFICATION_REJECTED |
| `publishProfile` | Admin | `professional.publish` | VERIFIED → DIRECTORY | ExcoAdmin | PROFILE_PUBLISHED |
| `unpublishProfile` | Admin | `professional.publish` | DIRECTORY → MEMBERS_ONLY | ExcoAdmin | PROFILE_UNPUBLISHED |
| `hideProfile` | Admin | `professional.publish` | → PRIVATE | ExcoAdmin | PROFILE_UNPUBLISHED |
| Document view | Own or `document.review` | Authorize then signed URL | — | No key in JSON | Optional |
| Document upload | Member | Own path | UPLOADED | Metadata only | DOCUMENT_UPLOADED |

Verify and publish run in a **transaction**: authorize → validate → state → history → audit → notify.

Notifications: workflow status only — not verification notes or admin notes.

Rate limiting: Phase 4 operational requirement (TBD numbers) for auth, upload, submit, verification, search, signed URLs, role changes.
