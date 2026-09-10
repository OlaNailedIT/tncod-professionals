# Phase 4 — Final evidence audit

**Date:** 2026-09-06  
**Auditor role:** independent evidence review of the Phase 4 runtime completion claim  
**Source report:** `docs/architecture/phase-4-runtime-completion-report.md`  
**Scope:** verify implementation + test methodology; do **not** start Phase 5  

This audit uses the same vocabulary as the Database Gate:

| Label | Meaning |
| --- | --- |
| CONFIRMED | File/catalog/test output supports the claim |
| PARTIAL | Claim is directionally true with a documented caveat |
| NOT CONFIRMED | Claim lacks executable evidence |
| OUT OF SCOPE | Correctly excluded |

---

## Audit decision

```text
PHASE 4 EVIDENCE AUDIT: PASS
PHASE 4 STATUS: COMPLETE
PHASE 5: READY FOR FORMAL GO REVIEW
PHASE 5 IMPLEMENTATION: NOT YET AUTHORIZED
```

Human-accepted closure: 2026-09-06. Next doc: `docs/architecture/phase-5-authorization-plan.md`.

Residual limitations (browser cookie login, signed URLs, seed Auth passwords, empty-email uniqueness, Storage HTTP 400) remain **documented**. They do **not** overturn Phase 4 completion under the approved narrow runtime scope.

---

## 1. Trigger implementation and privileges — CONFIRMED

**File:** `supabase/migrations/20260827140000_auth_user_sync.sql`  
**Live catalog (re-inspected 2026-09-06):**

| Property | Evidence |
| --- | --- |
| Function | `app.handle_new_auth_user` present |
| SECURITY DEFINER | `prosecdef = true` |
| Owner | `postgres` |
| search_path | `public, pg_temp` |
| Trigger | `on_auth_user_created` AFTER INSERT ON `auth.users` |
| EXECUTE | `postgres`, `supabase_auth_admin` only |
| Schema USAGE | `supabase_auth_admin` has USAGE on `app` |
| Metadata | body does **not** reference `raw_user_meta_data` / `raw_app_meta_data` |
| Privileged roles | only `WHERE r.name = 'MEMBER'` |
| Status fields | not written (`account_status` defaults ACTIVE; no verification/visibility) |

**Safety conclusion:** the trigger is an identity sync + default MEMBER assignment mechanism, not a privilege-assignment mechanism. Narrow `GRANT` to `supabase_auth_admin` is justified for GoTrue INSERT.

**Known residual:** `COALESCE(NEW.email, '')` can collide unique email if Auth creates multiple email-less users. Documented; not observed in executed tests.

---

## 2. Live Auth lifecycle methodology — CONFIRMED

**File:** `scripts/phase4-runtime-validate.ts`

Methodology (correct for Phase 4):

1. Create user via **Supabase Auth Admin HTTP** (`POST /auth/v1/admin/users`) — not a primary `INSERT INTO public.users`.
2. Assert `auth.users` and `public.users` counts for that id.
3. Assert email, `account_status`, roles = `MEMBER`, no `profiles` row.
4. Password grant sign-in used for Storage JWT subjects.

| Concern | Audit note |
| --- | --- |
| Uses service-role Admin API | Acceptable for synthetic local lifecycle; exercises real `auth.users` INSERT → trigger |
| Not public `/signup` UI | Correct — product Auth UI is out of Phase 4 |
| Browser cookie session | Explicitly **NOT EXECUTED** (report accurate) |

Prior execution recorded **0 FAILED** Auth lifecycle assertions in the Phase 4 run. This audit re-confirmed the live trigger catalog; it did not re-fire every Auth HTTP create (local disposable state already contains prior synthetic users).

---

## 3. Metadata escalation tests — CONFIRMED

Script supplies both `user_metadata` and `app_metadata` claiming SUPER_ADMIN / EXCO_ADMIN / VERIFIED / DIRECTORY / SUSPENDED / `user.manage_roles`.

Assertions:

- roles string-aggregate equals `MEMBER`
- `account_status` remains `ACTIVE`
- `profiles` count = 0

**Conclusion:** user-controlled metadata cannot grant administrative authority through the Phase 4 trigger. Matches frozen authentication boundary.

---

## 4. Storage HTTP methodology — CONFIRMED

Distinct from Database Gate table RLS:

- Uses Storage HTTP paths under `/storage/v1/object/member-documents/...`
- Subjects are Auth password JWTs (owner, other MEMBER, EXCO_ADMIN)
- EXCO_ADMIN is granted **after** Auth sync via privileged SQL (`INSERT INTO user_roles ... EXCO_ADMIN`) — correctly **not** via trigger
- Path enforcement tested with `leaks/{uid}/...` (denied)
- Signed URLs correctly **SKIPPED**

**Caveat (documented, acceptable):** denials recorded as HTTP **400**. Helper `isDeniedHttp` also accepts 401/403/404. Observed statuses in the report were 400; access was denied. Prefer recording exact status (already done) over assuming 403.

---

## 5. IDOR regression tests — CONFIRMED

**File:** `supabase/tests/gate-runtime-security.sql`

| Test | Assertion style |
| --- | --- |
| `member_a_cannot_update_b_opportunity` | `expect_denied` |
| `member_a_cannot_delete_b_opportunity` | `expect_denied` |
| `member_a_cannot_insert_b_opportunity` | `expect_denied` |
| `member_a_cannot_update_b_business_professional` | `expect_denied` |
| `member_a_cannot_delete_b_business_professional` | `expect_denied` |
| `member_a_cannot_insert_b_business_professional` | `expect_denied` |

Targets: owner opportunity (`verified.members`) and partner `business_professionals` on `Seed Advisory Ltd`.

**Re-execution this audit:** suite returned **38 PASSED / 0 FAILED**.

Note: `business_professionals` has no UPDATE policy in the frozen RLS design; UPDATE denial may appear as `denied_rowcount=0`. That still proves Member A cannot mutate the row.

---

## 6. Hardened denial-test logic — CONFIRMED

`pg_temp.expect_denied`:

- **PASS** on `42501` (`insufficient_privilege`)
- **PASS** on `P0001` (`raise_exception`, e.g. privileged-field guards)
- **PASS** on successful execute with **rowcount 0** (RLS filter)
- **FAIL** on any other SQLSTATE (`UNEXPECTED ...`)
- **FAIL** if mutation succeeds with rowcount > 0
- Resets role before writing `gate_results` (avoids temp-table privilege false failures)

This closes the Database Gate caveat that `EXCEPTION WHEN OTHERS` treated arbitrary errors as denial success.

---

## 7. Scope discipline (no Phase 5 / product UI) — CONFIRMED

`src/app` contains only:

- foundation home shell (status text only)
- `/api/health`
- `/api/runtime/session` (boolean JSON probe)
- `layout.tsx`

`src/components` contains only `ui/button.tsx`.

No registration, login, profile, directory, EXCO dashboard, design-system tokens, cards, tables, or filters were introduced as product surfaces.

Middleware is session refresh only — no product route protection matrix.

---

## 8. Report honesty check

| Report claim | Audit |
| --- | --- |
| Vocabulary distinguishes CREATED vs PASSED | CONFIRMED |
| Auth lifecycle via Auth runtime | CONFIRMED |
| Storage HTTP vs table RLS distinguished | CONFIRMED |
| Limitations listed (cookie login, signed URLs, seed Auth, empty email, HTTP 400) | CONFIRMED |
| Phase 5 not authorized | CONFIRMED |
| `/api/health` `rlsVerified: true` | **PARTIAL** — static status flag, not a live probe; acceptable diagnostic, not evidence by itself |
| Playwright “Chromium binary not required” | CONFIRMED for current request-based smoke; earlier Chromium-page attempt failed on missing browser binary |

No git repository is present on this workspace, so change inventory is file-based rather than commit-diff-based.

---

## 9. Residual risks to carry into later phases

1. Design registration/Auth so empty email cannot produce duplicate `''` emails.
2. When Auth UI exists, execute a browser cookie session round-trip.
3. Implement/test signed URLs only when the Storage access design requires them.
4. Prefer exact Storage denial status documentation; do not invent a 403 requirement without API contract.
5. Keep seed users and Auth users aligned when product Auth flows begin (seed currently bypasses Auth).

---

## Final recommendation

```text
ACCEPT Phase 4 as COMPLETE on local disposable evidence.

PHASE 5: READY FOR FORMAL GO REVIEW
PHASE 5 IMPLEMENTATION: NOT YET AUTHORIZED
```

Authorization plan: `docs/architecture/phase-5-authorization-plan.md`.
