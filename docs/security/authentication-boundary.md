# Authentication boundary

Trusted identity: **`auth.uid()`** = `auth.users.id` = `public.users.id`.

Domain `users` is the account row (`account_status`, email/phone copy). Profiles hang off `users.id`.

## Sync (Phase 4)

**Chosen:** controlled **database trigger** on `auth.users` INSERT → `public.users` (and not privileged roles). Alternative (trusted server transaction) is acceptable if trigger is unavailable; **never** client-created users for another `id`.

## Session (Supabase Auth)

Expiry/refresh/logout: Auth. Application must re-check `account_status` on privileged actions.

Passwordless: no app password store. Reset/verify email: Auth.

CSRF: if session cookies to same-site API, follow Supabase SSR guidance in Phase 4. Bearer tokens in Authorization header: CSRF lower; XSS/token-storage risk is higher. **Do not add arbitrary CSRF middleware without knowing the auth transport.** Not implemented.

Trigger MUST NOT assign EXCO_VIEWER, EXCO_ADMIN, or SUPER_ADMIN from user metadata. SUSPENDED/DEACTIVATED cannot perform normal application actions. Audit/verification/consents are not cascade-deleted.

## JWT

V1: **do not authorize from client-modified claims**. Permissions from `user_roles` in DB (RLS helpers + server). If JWT later includes roles: issued server-side only; refresh on role change; revocation = Auth sign-out / blocking `user_roles`.

## Headers (future app)

HTTPS; `X-Content-Type-Options: nosniff`; `Referrer-Policy`; frame denial; CSP tuned to stack — not a copy-paste that breaks Next.js. **Not implemented** (no app).
