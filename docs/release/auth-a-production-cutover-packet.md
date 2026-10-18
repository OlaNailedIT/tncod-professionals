# AUTH-A — staged Production release proposal

**Status: NOT AUTHORIZED / NOT EXECUTED.** Owner-approved non-Production tests
and general project continuation do not authorize this packet's Production
actions. No paid plan, add-on, new resource or spending fallback is included.

Target: TNCOD Professionals, Supabase `brpppukzqgpzxjelwwrj`, existing Vercel
project and `https://tncod-professionals-azure.vercel.app`.
Candidate: existing PR #25; freeze its exact reviewed head before approval.
Do not include PR #21's migration, role reclaims or unrelated release work.

## Evidence available, without reopening completed phases

- Hosted Free disposable proof: legacy-key denial with private publishable
  OTP/verify/refresh/sign-out and user-scoped RLS; original settings restored.
- Actual strict local build: public artifacts scanned for private credentials.
- Actual local browser: 19-check PKCE/profile/role journey and focused 13-check
  numeric-code/renewal/document-HTTP journey passed. These overlap.
- Actual local administrative consumers: 16 Storage/account-control checks
  passed. Initial failed attempts are retained, not silently replaced.
- CAPTCHA implementation/widget unchanged from historical real-registration
  evidence; local tests used a test verifier. Preserve real Turnstile config.

See `docs/security/auth-a-server-only-candidate.md` and its dated reports.
These do not certify the current Production environment or close AUTH-A.

## Approval and execution gates

### A — compatible application release (no provider-key deactivation)

1. Review PR #25's exact head, diff, CI, build and evidence. Record approval
   naming that head and this target; re-review if the head changes.
2. Under explicit merge/deployment approval, release compatible code through
   the normal Git-linked path. Record merge SHA, Vercel deployment identity,
   active alias and checks. No blanket CLI deploy or branch switch in a dirty
   checkout. An unexplained missing automatic deploy is a stop/diagnose gate.
3. AUTH-A remains open: releasing compatible code with legacy configuration
   neither removes public credentials nor disables their provider access.

### B — private configuration and compatible recovery baseline

Separate owner approval must name the Production environment changes below:

| Setting | Intended change |
| --- | --- |
| `SUPABASE_URL` | Actual Production project URL, verified before use |
| `SUPABASE_PUBLISHABLE_KEY` | Active low-privilege key never exposed to browser/history; create a fresh one under approval if provenance is uncertain |
| `SUPABASE_AUTH_SERVER_ONLY` | `1` |
| `SUPABASE_SERVICE_ROLE_KEY` | Modern administrative secret, not legacy `service_role` JWT; do not use it for ordinary SSR |
| Public Auth API-key variables | Remove legacy anon/publishable key values from every relevant browser-build scope; rebuild, do not merely edit runtime values |

Preserve database connections, site URL, Turnstile site/secret keys, cron
authorization and unrelated settings. Do not pull Production secrets into a
repository, browser, shell history, report, chat or non-Production deployment.

Before approving deactivation:

- Complete the actual deployed consumer list: app, registration compensation,
  account controls, documents/signed URLs, cleanup scheduler, operator scripts,
  integrations and historical/preview deployments. Classify each as migrated,
  explicitly retired, or still blocking. Source search alone is insufficient.
- Find every historically exposed active API key. The legacy toggle covers
  legacy anon and service-role keys; any exposed modern publishable key also
  needs a specifically approved revocation. Never disable an unreviewed list.
- Deploy strict private configuration. Prove active alias→deployment→Git SHA;
  inspect public bundles/prerendered output for key exposure without logging
  raw values. A homepage chunk match alone is insufficient identity proof.
- Use only an approved operator-controlled test identity. Check legitimate
  OTP/PKCE, refresh, active identity, sign-out, member/EXCO boundaries,
  registration/compensation and private document access. Do not probe real
  members, weaken CAPTCHA/signup, enable helpers or accept unexecuted PASS.
- Record this modern-key-compatible deployment and its matching configuration
  as the recovery baseline. Verify the platform can select it for recovery;
  a local `.next` directory is not a Production rollback artifact.

If a consumer or baseline is unverified, **stop before C**. No upgrade is an
allowed workaround. Confirmation that the stage-B build works is not AUTH-A
closeout while exposed provider keys still work.

### C — narrowly named key deactivation and final verification

Require separate explicit approval naming project `brpppukzqgpzxjelwwrj`,
legacy anon/service-role API-key deactivation and any additional exact exposed
modern key IDs. Do not rotate JWT signing keys or change signup policy.

Read back the resulting key state. Check synthetic known/unknown identifiers
with old/missing/invalid keys for uniform denial, then verify legitimate
private-key application flows and user-scoped RLS. Include previous legitimate
sessions/refresh; key deactivation is not a sign-out-all instruction.
Keep all raw keys, codes, cookies and signed URLs out of evidence.

Only actual active-Production results can close AUTH-A. Final public-launch
GO still depends on the separate privacy, recovery, participant/operator and
release gates on the LC board.

## Recovery, not an automatic re-enable path

- Before C, a failed configuration release is handled under its approved
  recovery decision; do not label the pre-existing enumeration residual fixed.
- After C, return only to the recorded modern-key-compatible build AND matching
  private configuration. Never blindly promote an older legacy-dependent
  deployment. A code SHA without its configuration is not a recovery baseline.
- Do not re-enable historically exposed keys, restore Viewer data access,
  undo migrations, clear migration history or change roles as automatic recovery.
  Such actions require a separate reviewed security/recovery decision.
- Record recovery action and test the selected active alias. Stop on identity,
  credential, cost or authorization ambiguity; do not repeatedly redeploy.
