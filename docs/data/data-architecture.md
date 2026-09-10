# TNCOD Professionals — Data architecture contract

**Phase 2 — finalized for freeze review**  
**Database:** one Supabase PostgreSQL. **ORM:** Prisma (not migration authority).  
**Auth:** Supabase Auth; `users.id` = `auth.users.id`. **Storage:** private objects; metadata in `documents`.

Hard rules:

```text
profile_status  ≠  verification_status  ≠  visibility_status
DIRECTORY requires VERIFIED
current state   ≠  historical event
database        ≠  UI
```

See also: `state-transitions.md`, `ownership-matrix.md`, `data-classification.md`, `consent.md`, `auth-and-migrations.md`, `erd.md`.

---

## Entity catalogue

| Entity | Purpose | Notes |
| --- | --- | --- |
| users | Account mirror of Auth | No password |
| roles, permissions, user_roles, role_permissions | Additive N:M RBAC | Four AppRole values |
| profiles | Professional identity + 3 statuses | Slug for public URL |
| professional_details | Structured profession fields | 1:1 |
| experiences | **Professional experience only** | No education/awards/certs entities |
| skills, profile_skills, services, profile_services, industries | Taxonomies | |
| businesses | Org entity | **No** `profile_id` |
| business_professionals | M:N association | OWNER/DIRECTOR/EMPLOYEE/PARTNER/REPRESENTATIVE — not legal registry |
| opportunities | Intent | SEEKING_EMPLOYMENT / OFFERING_SERVICES / COLLABORATION |
| church_information | `service_area` only | Never public |
| documents | Storage metadata | Never public; EXCO view-only in app |
| consents | Auditable grants | |
| verification_records | Review **history** | XOR profile/business |
| publications | Visibility **history** | `resulting_visibility` |
| admin_notes | Internal | XOR |
| spotlights | Editorial | UI Phase 14 |
| notifications | Workflow messages | UI later |
| audit_logs | System history | SET NULL actor; no cascade |

**Not tables:** directory, dashboard_stats, messaging, CV subsystems, `profile_opportunities`.

---

## Opportunity type-specific fields

| Field | SEEKING_EMPLOYMENT | OFFERING_SERVICES | COLLABORATION |
| --- | --- | --- | --- |
| title, description, status, expires_at | Yes | Yes | Yes |
| desired_role_title, employment_type, availability, location_preference, remote_preference | Yes | null | null |

Not a job board.

---

## Document types (V1)

`CV` · `PROFESSIONAL_CERTIFICATE` · `BUSINESS_REGISTRATION` · `OTHER`

---

## Permissions (additive)

`professional.view|edit|verify|publish`  
`business.view|manage|verify|publish`  
`opportunity.view|manage`  
`document.view|review`  
`spotlight.manage`  
`user.manage` · `user.manage_roles`  
`audit.view` · `configuration.manage` · `report.view`

Capability **design** hierarchy (not DB inheritance): MEMBER → EXCO_VIEWER → EXCO_ADMIN → SUPER_ADMIN.

---

## Delete / integrity

History: RESTRICT. Audit actor: SET NULL. Consents/verification: never ordinary cascade-delete. XOR CHECKs. `profiles`: DIRECTORY ⇒ VERIFIED CHECK.

---

## Search / reports

PostgreSQL only. Counts filter independent columns. No `dashboard_stats`.

---

## Seed

`prisma/seed.ts` — synthetic. **Not executed** in Phase 2.
