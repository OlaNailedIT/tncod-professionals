# Data classification and visibility (Phase 2)

Enforced in API/RLS (**Phase 3 contract** — see `docs/security/data-visibility-matrix.md`). Public directory is an **approved field subset**, never a raw profile row.

Classes: **PUBLIC** (directory projection) · **MEMBER_PRIVATE** · **EXCO_RESTRICTED** · **ADMIN_RESTRICTED** · **SYSTEM_RESTRICTED**

DIRECTORY listing also requires `verification_status = VERIFIED`.

## Visibility matrix

| Data | Member | EXCO | Public directory |
| --- | --- | --- | --- |
| Name | Own | Permitted | Conditional (listed) |
| Phone | Own | Permitted | No / controlled |
| Email | Own | Permitted | No / controlled |
| Profession | Own | Yes | Yes if listed |
| Skills | Own | Yes | Yes if listed |
| Professional experience | Own | Yes | Controlled subset |
| CV | Own | Review/view only | **No** |
| Professional certificates | Own | Review/view only | **No** |
| Business registration docs | Own/associated | Review/view only | **No** |
| Verification notes | No | Authorized EXCO | **No** |
| Job-seeking / opportunities | Own | Yes | Controlled |
| Headshot | Own | Yes | Conditional |
| Church service area | Own | Authorized | **No** |
| Admin notes | No | EXCO_ADMIN | **No** |
| Audit logs | No | Authorized (`audit.view`) | **No** |
| Consent records | Own status | Authorized | **No** |
| Storage keys | No | No (app uses signed view) | **No** |

EXCO is not one blob: Viewer ≠ Admin. See `ownership-matrix.md`.

## Sensitive / restricted

Documents, storage keys/paths, verification records/notes, admin notes, audit logs, consents, church `service_area`. Email and phone remain controlled.
