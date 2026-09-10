# Data ownership (CRUD) — Phase 2

C = create · R = read · U = update · D = delete/archive · V = verify · P = publish  
Roles: M member (own/associated) · Vw EXCO_VIEWER · Ad EXCO_ADMIN · Su SUPER_ADMIN

Viewer has **no mutation** unless noted. Permissions are **additive**. Only Su manages privileged roles.

| Entity | C | R | U | D/archive | V | P |
| --- | --- | --- | --- | --- | --- | --- |
| users | System (auth trigger) | Own; Ad/Su operational | Own limited; Su account status | Soft-delete Su/policy | — | — |
| profiles | System with user | Own; Vw permitted; Ad | Own content; Ad operational states | Soft-delete Ad/Su | Ad | Ad |
| professional_details | M | Own; Vw/Ad | M | With profile | — | — |
| experiences | M | Own; Vw/Ad; public subset | M | M | — | — |
| skills / services / industries | Su/config | All operational | Su/config | `is_active` | — | — |
| profile_skills / profile_services | M | Own; directory subset | M | M | — | — |
| businesses | M (via association) | Associated M; Vw/Ad | Associated M content; Ad status | Soft-delete Ad | Ad | Ad |
| business_professionals | M/Ad | Associated; Vw/Ad | Ad/M limited | Ad/M | — | — |
| opportunities | M | Own; Vw/Ad; directory controlled | M; Ad manage | M/Ad | — | — |
| church_information | M | Own; authorized EXCO | M | M | — | — |
| documents | M upload | Own; EXCO **review/view only** | M metadata; Ad review status | M/Ad policy | Ad review | — |
| consents | M (grant/withdraw events) | Own; authorized EXCO | Withdraw only (no rewrite history) | Never ordinary delete | — | — |
| verification_records | Ad | Authorized EXCO | No rewrite of history | Never cascade | Ad | — |
| publications | Ad | Authorized EXCO | No rewrite | Never cascade | — | Ad |
| admin_notes | Ad | Ad (not Viewer) | Ad | Ad | — | — |
| spotlights | Ad | Ad; public when published (Phase 14) | Ad | Ad archive | — | Ad |
| notifications | System | Own | Own `read_at` | System | — | — |
| audit_logs | System | Su / `audit.view` | Never | Never cascade | — | — |
| roles / permissions | Su | Su | Su | Su | — | — |
| user_roles | Su (`user.manage_roles`) | Su/Ad limited | Su | Su | — | — |
| role_permissions | Su | Su | Su | Su | — | — |

MEMBER: own profile, experience, business associations, opportunities, uploads, visibility **preferences** (EXCO still publishes).  
EXCO_VIEWER: read permitted operational data; document **view** if `document.view`; **no** verify/publish/notes.  
EXCO_ADMIN: review, verify, visibility, business/opportunity/spotlight admin.  
SUPER_ADMIN: administrators, configuration, `user.manage_roles`.
