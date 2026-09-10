# Permission matrix

Authoritative for Phase 3. Keys should match `permissions.key` (seed) plus aliases noted.

Roles are **additive**. Ownership: Own = `profiles.user_id = auth.uid()` (or associated via `business_professionals` where stated).

| Resource | Action | Permission key | Member | Viewer | Admin | Super | Ownership / notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Profile | View own | `professional.view` | ✓ | — | ✓* | ✓* | Own; *EXCO via internal view |
| Profile | Edit own content | `professional.edit` | ✓ | — | — | Restricted | Own; **not** verify/DIRECTORY |
| Profile | Create | (trigger + insert own) | ✓ | — | — | — | Own user row |
| Profile | Submit | domain `submitProfile` | ✓ | — | — | — | Own; sets SUBMITTED/PENDING |
| Profile | Directory view | public query | — | ✓ listed | ✓ | ✓ | DIRECTORY+VERIFIED projection |
| Profile | Internal view | `professional.view` + EXCO | — | Permitted ops | ✓ | ✓ | Not all internal fields for Viewer |
| Profile | Verify / reject / clarify | `professional.verify` | — | — | ✓ | ✓ | Domain command |
| Profile | Publish / unpublish | `professional.publish` | — | — | ✓ | ✓ | Never member DIRECTORY |
| Business | View associated | `business.view` | ✓ assoc. | Approved/ops | ✓ | ✓ | Association |
| Business | Manage content | `business.manage` | ✓ assoc. | — | ✓ | ✓ | Not approval/publish |
| Business | Verify / publish | `business.verify` / `business.publish` | — | — | ✓ | ✓ | |
| Opportunity | Own CRUD | `opportunity.view` / `manage` | ✓ | — | operational | ✓ | Own profile |
| Opportunity | Operational manage | `opportunity.manage` | — | — | ✓ | ✓ | |
| Document | Upload/view own | `document.view` | ✓ | — | — | — | Own; private storage |
| Document | Internal view | `document.review` | — | — | ✓ view-only | ✓ | No public URL; copying in browser still possible |
| Verification records | View | `professional.verify` or view | Own **status** only | Restricted | ✓ | ✓ | Notes: Admin+ |
| Verification | Manage | `professional.verify` | — | — | ✓ | ✓ | |
| Admin notes | View/create | — | — | **No** | ✓ | ✓ | Never member/public |
| Spotlight | Manage | `spotlight.manage` | — | — | ✓ | ✓ | |
| Spotlight | View published | — | public if published | ✓ | ✓ | ✓ | Phase 14 |
| Notification | Own | — | ✓ | — | — | — | Own `user_id` |
| Consent | Own grant/withdraw | — | ✓ | — | Authorized | ✓ | No history rewrite |
| Audit | View | `audit.view` | — | — | Limited | ✓ | No write |
| Users / roles | Manage | `user.manage` / `user.manage_roles` | — | — | — | ✓ | Escalation denied for others |
| Configuration | Manage | `configuration.manage` | — | — | — | ✓ | |
| Reports | View | `report.view` | — | View | ✓ | ✓ | Aggregates only |

Unused catalogue entries from the instruction (`profile.view.own` etc.) **map** to the keys above. Do not duplicate rows in `permissions` without a use.

**Backend:** required for every privileged mutation. **RLS:** row filter. **Audit:** verify, publish, role change, document review, consent, suspend.

| Permission | Resource | Action | Ownership | RLS | Backend | Audit |
| --- | --- | --- | --- | --- | --- | --- |
| `professional.view` | Profile | Read | Own or EXCO permitted | Yes | Projection | No |
| `professional.edit` | Profile content | Update | Own | Yes + column trigger | Field allowlist | PROFILE_UPDATED |
| domain `submitProfile` | Profile | Submit | Own | Row own | Transition | PROFILE_SUBMITTED |
| `professional.verify` | Profile/business | Verify | Admin | Admin insert history | Legal graph + txn | VERIFICATION_* |
| `professional.publish` | Profile | Publish | Admin | Admin | VERIFIED check + txn | PROFILE_PUBLISHED |
| `business.manage` | Business content | Update | Associated | Associated | Not status cols | Optional |
| `business.verify` / `publish` | Business | Approve/publish | Admin | Admin | Split status/visibility | BUSINESS_* |
| `document.view` | Document | Own upload/view | Own | Own path | MIME/size | DOCUMENT_UPLOADED |
| `document.review` | Document | Internal view | Admin | Review SELECT | Signed URL | DOCUMENT_APPROVED/REJECTED |
| (ownership) | Consent | Grant/withdraw | Own user_id | Own | New row / withdraw | CONSENT_* |
| `audit.view` | Audit | Read | Super / limited admin | SELECT only | No write API | N/A |
| `user.manage_roles` | user_roles | Write | Super | Super | Deny self-elevate rules | ROLE_CHANGED |
| `spotlight.manage` | Spotlight | CRUD | Admin | Admin | Editorial | Optional |
| `configuration.manage` | System | Write | Super | Super | Never expose secrets | Optional |
