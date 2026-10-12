# Phase 23 — Controlled Pilot (Execution Protocol)

**Status:** `AUTHORIZED` / `IN PROGRESS` — awaiting real cohort evidence  
**Predecessor:** Phase 23B — PASS / COMPLETE / VERIFIED / LOCKED  
**Successor:** Phase 24+ — **NOT AUTHORIZED** (even if pilot passes)

---

## Purpose

Validate with a deliberately limited group of **real TNCOD Professionals** whether the platform is useful, understandable, trustworthy, and operationally workable.

This is **not** implementation. This is **not** promotional launch.

---

## Governance

```text
PHASE 5–13, 18–22, 23A, 23B — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 23 — CONTROLLED PILOT — AUTHORIZED / IN PROGRESS
PHASE 24+ — NOT AUTHORIZED
```

Hard rules during the pilot:

- Do **not** redesign or ship features from feedback without new authorization.
- Do **not** reopen locked phases.
- Do **not** fabricate directory population or fake users.
- Do **not** coach participants into success unless blocked — and then record the intervention.
- Do **not** commit participant PII or secrets to the repository.

---

## Production URL

```text
https://tncod-professionals-azure.vercel.app
```

---

## Pre-pilot gate (2026-09-15)

| Check | Result | Class |
| --- | --- | --- |
| `/` 200 + Phase 23A/B copy | PASS | PRODUCTION-SMOKE |
| `/join` `/sign-in` `/professionals` 200 | PASS | PRODUCTION-SMOKE |
| Member/EXCO routes 307 → sign-in when anon | PASS | PRODUCTION-SMOKE |
| `/design-system` 404 | PASS | PRODUCTION-SMOKE |
| Security headers present | PASS | PRODUCTION-SMOKE |

Authenticated EXCO/member paths and OTP must be confirmed by the owner/operators during the cohort (not inventable by automation alone).

---

## Cohort design

**Target:** 10–20 real TNCOD professionals  
**Not:** whole congregation; open public launch

### Required persona coverage

| Code | Persona | Primary journey |
| --- | --- | --- |
| A | Ordinary professional | Landing → join → OTP → dashboard → profile |
| B | Business owner | Profile → businesses → public vs private clarity |
| C | Opportunity-seeking | Profile → opportunities → understand scope |
| D | EXCO operator (≥1) | Sign in → EXCO entry → ops → verification → analytics |

Also seek mix of digital confidence (high / average / lower) and devices (iPhone, Android, desktop).

---

## Invitation language (non-coaching)

Suggested controlled invite (adapt as needed; do not oversell):

> You are invited to try TNCOD Professionals — our community professional network — in a small pilot.  
> Link: https://tncod-professionals-azure.vercel.app  
> Please use it as you naturally would. There is no right answer. We want honest reactions — including confusion.  
> Joining does not verify you or list you publicly. OTP sign-in uses email (no password).

Record invitation date and persona target **offline** (not in git with personal details).

---

## Session protocol (observer)

### Before explaining anything

Ask and record verbatim:

1. “You have just been given this link. What do you think this platform is for?”

### Then observe without coaching

| Step | Observe |
| --- | --- |
| Registration | Time, hesitations, abandonments, validation, mobile keyboard |
| OTP | Delivery delay, resend, wrong code, app switching |
| Dashboard | First action; “What would you do next?” |
| Profile | Completion vs verification vs publication confusion |
| Privacy | Can they find `/settings/privacy`? What does “Public directory” mean to them? |
| Directory | Empty-state understanding; comfort to appear |
| Opportunities | What do they think it is? (Must not become job-board belief) |
| Business (if B) | Business ≠ automatic public listing |
| EXCO (if D) | Entry visible? Workflow clear without undocumented URLs? |
| Member deny | Ordinary member: EXCO absent; `/exco` denied |

### Closing questions (short)

1. What do you think TNCOD Professionals is for?  
2. What did you expect to find here?  
3. What was easiest?  
4. What was confusing?  
5. Did anything make you hesitate to provide information?  
6. What would make this more useful to you?  
7. Would you return?  
8. Would you recommend another TNCOD professional to join?  
9. What would make you more likely to use it regularly?

Ignore compliments-as-theatre (“Looks nice”) unless paired with behaviour.

---

## Observation sheet (copy per participant — store offline)

```text
Participant code: P-___
Persona: A / B / C / D
Device: ________
Digital confidence: high / average / lower
Invited: ____-__-__
Started: ____-__-__
Completed registration: Y/N
Auth success: Y/N
Profile touched: Y/N
Privacy found unprompted: Y/N
Directory understood: Y/N
Opportunities understood: Y/N
Business path (if any): Y/N / N/A
EXCO path (if D): Y/N
Coaching interventions: ________
First interpretation (verbatim): ________
Next action after login (verbatim): ________
Friction notes: ________
Value notes: ________
Trust notes: ________
Severity flags: none / P2 / P1 / P0
Evidence class: REAL-PILOT-PARTICIPANT
```

---

## Metrics (aggregate — no PII in repo)

```text
Invited
Started registration
Completed registration
Registration abandonment
Authentication success / failure
Profile completion progressed
Verification progressed (if any)
Directory publication (must remain EXCO-controlled)
EXCO review actions
Return visits
Recommend? (Y/N/unsure counts)
```

Qualitative top-5 lists: friction · value · trust · requested improvements · misunderstandings

---

## Decision register template

| Finding | Evidence class | Severity | Decision | Action | Owner | Phase | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| … | REAL-PILOT-PARTICIPANT | P2 | DEFERRED | backlog | Owner | post-23 | OPEN |

Allowed decisions: `LOCKED` · `REMEDIATE` · `DEFERRED` · `REJECTED` · `OUT OF SCOPE`

---

## Change control

| Severity | Response |
| --- | --- |
| P0 | STOP that path · contain · document · do not silent-patch locked contracts |
| P1 | Classify · preserve evidence · remediation needs explicit authorization |
| P2/P3 | Usually post-pilot backlog |

---

## Closeout verdict options

```text
PASS
PASS WITH NON-BLOCKING FINDINGS
PAUSE FOR REMEDIATION
FAIL
```

Pilot PASS does **not** authorize Phase 24.

---

## Agent / tooling boundary

Cursor agents may:

- maintain this protocol and the report structure;
- run Production smoke / security regression (read-only);
- help classify findings **after** real evidence is provided.

Cursor agents must **not**:

- invent participant quotes or metrics;
- claim PASS without REAL-PILOT-PARTICIPANT evidence;
- implement features from feedback during the pilot;
- mutate Production data outside legitimate participant use.
