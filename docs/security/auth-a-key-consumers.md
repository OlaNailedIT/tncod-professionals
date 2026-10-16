# AUTH-A credential-consumer inventory

Repository inspection for draft PR #25; not a Production configuration inventory.
No Production credentials were pulled or changed. External integrations and
scheduled consumers cannot be declared absent from a source search alone.

| Consumer | Credential route | Cutover requirement |
| --- | --- | --- |
| SSR session, middleware, OTP request, PKCE exchange, numeric OTP and sign-out | `getSessionSupabaseConfig()`; low-privilege private publishable key | Strict server-only configuration; retain user-session RLS and active-identity checks |
| Registration provisioning and compensation | `createServiceRoleClient()` via `SUPABASE_SERVICE_ROLE_KEY` | Replace the variable's legacy value with a modern secret before legacy-key deactivation; never use this client for ordinary sessions |
| Account activation/suspension synchronization | Same privileged client in `server/auth/account-status.ts` | Verify Auth Admin update and application-status consistency with the modern secret |
| Private business document upload and short-lived signed URLs | Same privileged client in `features/business/business-documents.ts` | Verify actual Storage operations and domain authorization; private bucket must remain private |
| Non-Production session/OTP helper routes | Existing privileged client and session config | Must remain disabled in production-mode acceptance and Production |
| Browser factory `lib/supabase/browser.ts` | Legacy public environment | No application caller found outside its own definition; strict builds supply no public key. Do not introduce a browser caller |
| Legacy-import administration | `features/legacy-migration/auth-admin.ts`; callers supply URL/key | Historical/manual workflow, not ordinary SSR. Any future invocation needs modern secret and explicit import authorization |
| Historical runtime/forensic scripts | `phase4-runtime-validate.ts`, `phase6-registration-proof.ts`, `phase6-forensic-clarification.ts`, `phase4-stale-session-probe.cjs`, `phase4-signup-deny-probe.cjs`, controlled identity/account-status scripts | Not blanket-approved for post-cutover execution. Some manually send legacy key values as bearer JWTs; these must be adapted or retired before reuse, not silently pointed at Production |
| CI verification | `.github/workflows/ci.yml` uses public placeholder, no service key | Compatibility-mode unit/build verification only; not evidence that Production is strict or that disposable acceptance ran |
| Registration cleanup endpoint | Domain cleanup path, cron authorization and privileged client | Confirm the deployed scheduler/environment and modern administrative credential separately; source code does not prove scheduler operation |

## Evidence boundaries

- Hosted disposable proof covers provider key deactivation, OTP/refresh and
  user-scoped RLS, with initial key/signup settings restored afterwards.
- The first local full application proof covers real browser PKCE, persisted
  registration/profile, role gates, active identity and sign-out. It uses the
  test CAPTCHA verifier for registration, not a real CAPTCHA submission.
- Numeric-code, renewed-session and private-document results must be read from
  the dated application report, not inferred from this inventory.
- Independent local component proof passed 16 checks for real document
  upload/private download and owner/Member/Viewer/Admin/Super boundaries,
  plus canonical Auth ban/application-status suspension/reactivation using
  the modern secret. Initial failed and revised passing runs are both in
  `docs/release/evidence/auth-a/local-consumers.json`. This does not prove the
  signed-document HTTP route with a browser session or Production operation.
- Before any Production proposal, compare the actual environment variable
  consumers, jobs and external tools with this list, and identify a tested
  modern-key-compatible rollback build. Never export their raw credentials.

Deactivating legacy API keys disables both legacy `anon` and `service_role`.
It is not JWT signing-key rotation. No part of this inventory authorizes
deactivation, role changes, migration, merge or deployment in Production.
