# Phase 23 — Controlled Pilot Report

**Status:** `IN PROGRESS` — authentication blocker remediated 2026-09-16; cohort not yet completed  
**Report class:** Living document. Sections marked **PENDING COHORT** must not be filled with fabricated evidence.  
**Protocol:** `docs/product/phase-23-controlled-pilot-protocol.md`  
**Auth remediation:** `docs/product/phase-23-new-member-otp-remediation.md`

---

## Executive verdict

```text
PHASE 23 — CONTROLLED PILOT — RESUME
```

**Pilot verdict (human product readiness for broader controlled adoption):** **NOT YET DETERMINED** (cohort evidence still required)

2026-09-16: new-member OTP forensic remediation deployed (`dpl_BZZkuse9m9MF4RGvxzh6JAPoL1g1`). Controlled new-member Auth→OTP→session path verified. Resume controlled cohort onboarding; do not treat Auth as a remaining hard blocker.

---

## Pilot objective

> Is TNCOD Professionals genuinely useful, understandable, trustworthy, and operationally workable for real TNCOD professionals?

---

## Pilot cohort

| Metric | Value |
| --- | --- |
| Participants invited | **PENDING COHORT** |
| Participants started | **PENDING COHORT** |
| Participants completed registration | **PENDING COHORT** |
| Personas covered | Target: A ordinary · B business · C opportunity-seeking · D EXCO |
| Devices covered | Target: iPhone · Android · desktop |

Do not publish participant names or emails in this repository.

---

## Journey coverage

| Journey | Status |
| --- | --- |
| Landing → join → OTP → dashboard → profile | PENDING COHORT |
| Business owner path | PENDING COHORT |
| Opportunities understanding | PENDING COHORT |
| Privacy / visibility discovery | PENDING COHORT |
| Directory empty-state comprehension | PENDING COHORT |
| EXCO entry → professionals → verification → analytics | PENDING COHORT |
| Ordinary member EXCO denial | PENDING COHORT |

---

## Registration results

**PENDING COHORT** (`REAL-PILOT-PARTICIPANT`)

Track: start / complete / abandon / time / hesitations / validation friction / mobile keyboard.

Historical target ~30–60 seconds is observational only — do not force it.

---

## Authentication results

**AUTH PATH REMEDIATED** (2026-09-16) — see `phase-23-new-member-otp-remediation.md`.

**TEST ACCOUNT CLEANUP** (2026-09-16) — see `phase-23-test-account-cleanup.md`. Exactly seven authorized test profile UUIDs soft-deleted + Auth removed. Phase 18 imports and owner EXCO intact.

Controlled forensic: `/join` creates Auth + `public.users` + profile without OTP; `/sign-in` `signInWithOtp` accepted; session established for newest non-legacy member. Hosted template is OTP-digits-only; `site_url` re-pinned to azure canonical.

**PENDING COHORT** for qualitative OTP UX notes from real pilot participants (delay, spam, resend clarity). Architecture remains Phase 20.5 LOCKED — do not redesign Auth mid-pilot.

---

## Member UX findings

**PENDING COHORT**

Capture: first interpretation; next action after login; completion vs verification vs publication confusion; navigation behaviour (including Directory return / `NAVIGATION_OBSERVATION`).

---

## Directory findings

**PENDING COHORT**

Empty/sparse directory is honest. No fake population. Record understanding of join ≠ verify ≠ publish.

---

## Privacy / visibility findings

**PENDING COHORT**

Key probe: unprompted discovery of `/settings/privacy`; meaning of “Public directory” (preference ≠ guaranteed exposure).

---

## Business findings

**PENDING COHORT** (Persona B)

Watch for incorrect assumption: business relationship = public business listing.

---

## Opportunity findings

**PENDING COHORT** (Persona C)

Confirm participants do not treat Opportunities as LinkedIn / job board / messaging.

---

## EXCO operational findings

**PENDING COHORT** (`EXCO-OPERATOR`)

Required: EXCO entry visible after sign-in; workflow without undocumented URL knowledge; answer “If a new professional registered today, what would you do next?”

Regression: ordinary member → EXCO absent → `/exco` denied.

---

## Mobile findings

**PENDING COHORT**

---

## Accessibility findings

**PENDING COHORT** (prefer ≥1 keyboard-only and/or screen-reader participant where practical)

---

## Performance findings

**PENDING COHORT** + optional PRODUCTION-SMOKE timings

Pre-pilot note: prior ~1.1–1.5s public TTFB classified as non-blocking unless cohort reports blocking waits.

---

## Trust findings

**PENDING COHORT**

Comfortable information · hesitations · trust builders.

---

## Value findings

**PENDING COHORT**

Worth returning · who to find · recommendability. Prefer behaviour over compliments.

---

## Security findings

### Pre-pilot regression (read-only / smoke)

| Check | Result | Class |
| --- | --- | --- |
| Anon member routes redirect to sign-in | PASS | PRODUCTION-SMOKE |
| Anon `/exco` redirect to sign-in | PASS | PRODUCTION-SMOKE |
| Security headers (HSTS, XFO DENY, nosniff, Referrer, Permissions-Policy) | PASS | PRODUCTION-SMOKE |
| `/design-system` not public product surface | PASS (404) | PRODUCTION-SMOKE |
| Phase 13 / 20.5 / 21 contracts | Intact by governance — no mid-pilot changes authorized | GOVERNANCE |

### During / after cohort

Ownership · EXCO_VIEWER vs ADMIN · directory projection · contact privacy · no client role spoof · nav ≠ authz — **PENDING COHORT / MANUAL-PRODUCTION**

Unresolved P0 security → FAIL / STOP.

---

## Data integrity findings

**PENDING COHORT** (`DATA-RECONCILIATION`)

After activity: duplicates, orphans, unauthorized verification/publication, private-field leakage. No cosmetic SQL cleanup.

---

## Quantitative metrics

| Metric | Count |
| --- | --- |
| Invited | — |
| Started registration | — |
| Completed registration | — |
| Abandoned registration | — |
| Auth success | — |
| Auth failure | — |
| Profile progressed | — |
| Recommend yes / no / unsure | — / — / — |

---

## Qualitative findings

| Theme | Notes |
| --- | --- |
| Top friction | PENDING COHORT |
| Top value signals | PENDING COHORT |
| Top trust concerns | PENDING COHORT |
| Top requested improvements | PENDING COHORT |
| Top misunderstandings | PENDING COHORT |

---

## Observed behaviour

**PENDING COHORT** — uncoached completions, returns, recommendations, EXCO workflow success.

---

## Participant quotes

Only anonymized, appropriately captured quotes. **None yet.**

---

## Findings register

| Finding | Evidence | Severity | Decision | Action | Status |
| --- | --- | --- | --- | --- | --- |
| Cohort not yet executed | GOVERNANCE | — | LOCKED process | Run protocol | OPEN |
| UX-002 role-admin UI | Prior | P3/ops | DEFERRED | Separate auth | DEFERRED |
| Directory empty | PRODUCT | P3 | LOCKED (honest) | Do not fake populate | LOCKED |

---

## Deferred improvements

Filled after cohort. Do not auto-implement.

---

## Recommended next phase

**Not authorized.** After closeout, owner decides whether evidence supports a separate Phase 24 authorization. Pilot PASS ≠ launch.

---

## Production impact (this phase to date)

```text
Application deployment: NONE under Phase 23 authorization (uses existing 23B Production)
Database schema changes: NONE
Production data mutations: ONLY legitimate future participant activity
Auth changes: NONE
RLS changes: NONE
RBAC changes: NONE
Storage changes: NONE
```

---

## Regression reminder (before closeout)

Confirm Phase 13 · 20.5 · 21 · 22 · 23A · 23B remain intact. Do not reopen for feature requests.

---

## Closeout checklist

```text
□ Controlled cohort completed (≈10–20)
□ Personas A–D covered (D ≥1 EXCO)
□ Registration / auth / member / privacy / directory / opportunities observed
□ Business path where applicable
□ EXCO workflow + member deny regression
□ Mobile evidence
□ Accessibility barriers assessed
□ Security regression during/after pilot
□ Data integrity checked
□ Feedback + behavioural evidence collected
□ Findings severity-classified
□ No unresolved P0
□ P1 resolved or explicitly accepted
□ This report completed with REAL evidence classes
□ Next-phase recommendation documented (not auto-authorized)
```

---

## Governance snapshot

```text
PHASE 5–13   — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 18–21  — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 22     — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 23A    — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 23B    — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 23 — CONTROLLED PILOT — AUTHORIZED / IN PROGRESS

PHASE 24+ — NOT AUTHORIZED

HARD STOP ON IMPLEMENTATION AND LAUNCH
```
