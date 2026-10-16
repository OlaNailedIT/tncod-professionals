# AUTH-A — Hosted non-Production proof (LC-C)

**Authorized:** 2026-10-16 (owner: bounded hosted experiment only — **not** Production cutover, **not** #21 migration, **not** #23/#24 merge)  
**Status:** **BLOCKED** — missing disposable hosted resource / cost confirmation  
**Production project:** `brpppukzqgpzxjelwwrj` — **EXCLUDED**

---

## Inventory (executed)

| Check | Result |
| --- | --- |
| Org visible to CLI | `OlaNailedIT` / `qrctrhdndbuypymdxzkr` |
| Hosted projects in org | **Only** `tncod-professionals` (`brpppukzqgpzxjelwwrj`) — Production |
| Existing dedicated disposable project | **None** |
| Customer-data-free alternate project | **None found** |
| Local disposable stack | Available (`127.0.0.1:54321`) — **insufficient** for Dashboard legacy-key deactivation proof (prior Kong probe inconclusive) |

## Cost gate (stop condition)

Authorization allows creating **one** disposable hosted project **only if verified to add no charge**.

Official pricing ([supabase.com/pricing](https://supabase.com/pricing)):

| Org plan | Second project |
| --- | --- |
| **Free** | $0 (limit 2 active projects; inactivity pause after ~1 week) |
| **Pro / Team** | Additional **Micro compute ≈ $10 / month** (plan includes $10 credits covering **one** Micro; a second project is billed) |

This org’s **subscription plan is not confirmed** from CLI inventory (no billing field on `orgs list` / `projects list`). Because the only project is live Production, **additional charge cannot be ruled out**. Per authorization: **do not create** until cost is confirmed.

## Documentation reconfirmed (pre-implementation)

From [API keys](https://supabase.com/docs/guides/getting-started/api-keys) / [Migrating to new API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys):

- Creating publishable/secret keys **does not** revoke legacy `anon` / `service_role`.
- Legacy keys remain valid until **Dashboard Settings → API Keys → deactivate** (separate, reversible step).
- Publishable → `anon` / `authenticated` with RLS; secret → `service_role` **BYPASSRLS** (unsuitable for ordinary SSR).

This **supports testing** the proposal; it does **not** make the proposal proven.

## Test matrix (hosted)

| # | Proof item | Status |
| --- | --- | --- |
| 1 | Server-held publishable: registration, existing OTP, verify, session refresh, sign-out | **SKIPPED** — no disposable hosted project |
| 2 | Unknown-user sign-in does not create account | **SKIPPED** |
| 3 | Legacy credentials work before deactivation; rejected after on hosted Auth | **SKIPPED** |
| 4 | Missing/invalid credentials cannot recover enumeration | **SKIPPED** |
| 5 | Anon / authenticated RLS boundaries enforced | **SKIPPED** |
| 6 | Replacement key absent from browser bundles / public artifacts | **SKIPPED** |
| 7 | Pre-deactivation tokens/sessions evaluated | **SKIPPED** |
| 8 | App-facing auth responses remain neutral; no alternate exposed oracle | **SKIPPED** |
| 9 | Recovery steps for legacy-key deactivation identified | **SKIPPED** |

## Supported conclusion

**Blocked — not disproven, not proven.**

Remaining uncertainty: whether Dashboard deactivation of legacy `anon` on a hosted project, paired with a **server-only** publishable key wired into the real app Auth integration, closes the unauthenticated external enumeration path without weakening registration / OTP / session / RLS.

## Recommendation

**Blocked** pending smallest owner action (choose one):

1. **Confirm** org `qrctrhdndbuypymdxzkr` is on **Free** plan → Cursor creates disposable project `tncod-auth-a-proof` (no charge) and resumes the matrix; or  
2. **Authorize spend** of ~**$10/month** Micro compute for a second project in the current (likely paid) org for this disposable proof; or  
3. Create a **separate Free-plan organization** (or empty disposable project) yourself, confirm it holds **no** customer data and serves **no** other app, and paste **project ref + authorization to mutate keys/Auth settings** there.

Do **not** use Production `brpppukzqgpzxjelwwrj`.  
A successful hosted experiment is **not** Production verification or public-launch PASS.

## Related open items (not this authorization)

- #22 signed-in Member↔EXCO acceptance on azure (human).  
- Git→Vercel automatic Production deploy for `1a69915` never fired — **OPEN** reliability issue.  
- #21 migration / #23 / #24 merge — **not** authorized here.
