# Data visibility matrix (API projections)

Never `SELECT *` for application responses.

Projections: `PublicProfessional` · `MemberProfessional` · `ExcoViewerProfessional` · `ExcoAdminProfessional`.

Anonymous directory = `PublicProfessional` only, and only when:

`visibility_status = DIRECTORY` AND `verification_status = VERIFIED`.

Headshot: `profile_image_storage_key` is **not** a public object. If directory images ship later, mint a short-lived URL after the listing check. Never return the storage key.

| Field (schema) | Class | Member own | Member other (MEMBERS_ONLY+VERIFIED) | EXCO_VIEWER | EXCO_ADMIN | SUPER_ADMIN | Anonymous directory |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `display_name` | PUBLIC* | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ if listed |
| `headline`, `location` | PUBLIC* | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ if listed |
| `professional_details.profession`, `professional_title` | PUBLIC* | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ if listed |
| skills / services (joins) | PUBLIC* | ✓ | ✓ | ✓ | ✓ | ✓ | listed subset later; not in v1 SQL projection |
| `experiences` | PUBLIC* | ✓ | Controlled subset | ✓ | ✓ | ✓ | not in v1 SQL projection |
| `profile_image_storage_key` | MEMBER_PRIVATE | Own use | No | No key | No key | No key | **No** |
| `users.email`, `users.phone` | MEMBER_PRIVATE | ✓ | **No** | **No** (API) | Controlled | Controlled | **No** |
| opportunities / job-seeking | Controlled | ✓ | No (unless listed rules) | Non-draft | ✓ | ✓ | Controlled if listed later |
| business public fields | PUBLIC* | Associated | No | APPROVED only | ✓ | ✓ | Conditional later |
| `church_information.service_area` | EXCO_RESTRICTED | ✓ | **No** | **No** | Need-based ✓ | ✓ | **No** |
| `documents`, `storage_key` | MEMBER_PRIVATE / SYSTEM | Own | **No** | **No** (no `document.review`) | View-only | View-only | **No** |
| `verification_records.notes` | EXCO_RESTRICTED | Own **status** on profile only | **No** | **No** | ✓ | ✓ | **No** |
| `admin_notes` | ADMIN_RESTRICTED | **No** | **No** | **No** | ✓ | ✓ | **No** |
| `consents` | MEMBER_PRIVATE | Own | **No** | **No** | Authorized | ✓ | **No** |
| `audit_logs` | SYSTEM_RESTRICTED | **No** | **No** | **No** | `audit.view` | ✓ | **No** |
| `verification_status`, `visibility_status` | Internal | Own view | No | Ops view | ✓ | ✓ | Not raw dump |

\*PUBLIC only when visibility rules permit.

## Table classification

| Table | Class |
| --- | --- |
| `directory_professionals` (view/fn) | PUBLIC (filtered) |
| `skills`, `services`, `industries` (active) | PUBLIC catalogue |
| `profiles`, `professional_details`, `experiences`, `profile_skills`, `profile_services` | Mixed — projection-dependent |
| `users` | MEMBER_PRIVATE |
| `opportunities` | Controlled |
| `businesses`, `business_professionals` | Mixed |
| `church_information` | EXCO_RESTRICTED |
| `documents` | MEMBER_PRIVATE / SYSTEM_RESTRICTED keys |
| `verification_records`, `publications` | EXCO_RESTRICTED / ADMIN |
| `admin_notes` | ADMIN_RESTRICTED |
| `consents` | MEMBER_PRIVATE |
| `audit_logs`, `permissions`, `role_permissions` | SYSTEM_RESTRICTED |
| `roles`, `user_roles` | SYSTEM (own assignment readable) |
| `notifications` | MEMBER_PRIVATE |
| `spotlights` | Mixed (PUBLISHED vs draft) |
