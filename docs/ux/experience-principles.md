# Phase 1.1 — Experience principles and user journey architecture

**Status:** LOCKED  
**Depends on:** Phase 0 product specification  
**Next:** `information-architecture.md`

---

## UX north star

The experience should make professional participation feel:

> **Easy to enter, useful to complete, trustworthy to engage with, and simple to maintain.**

Design around the **user’s goal**, not around database fields. A person should never feel they are navigating TNCOD’s internal data structure.

```text
                    TNCOD PROFESSIONALS
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
          MEMBERS                       EXCO
             │                           │
       "Help me participate"       "Help me activate
                                    the community"
```

---

## Member experience principles

| # | Principle | Meaning |
| --- | --- | --- |
| 1 | Start with inclusion | First interaction: there is a place for you. Do not use eligibility questions (“Are you a qualified professional?”). Ask **current professional situation**. |
| 2 | Registration almost effortless | Stage 1 is the doorway, not the full profile. Target **30–60 seconds**. No documents, biography, LinkedIn, or career essay. |
| 3 | Explain why we ask | Thoughtful questions need purpose copy (e.g. “What are you looking for?” → help us understand useful opportunities or support). |
| 4 | Progressive completion | Join → useful immediately → complete more when ready → more discoverable → more opportunities. Completion is a **value journey**, not a gate. |
| 5 | Never punish incomplete profiles | “You can improve this,” not “You have failed.” |
| 6 | Trust must be precise | Distinguish submitted / reviewed / verified credentials / directory approval. No generic green ticks everywhere. |
| 7 | Mobile first | Large targets, short sections, minimal typing, clear progress, save protection. Desktop adapts from mobile. |

Tone: welcoming, low-pressure, simple, community-oriented, trustworthy.

> “I am joining a professional community.”  
> Not: “I am filling a government registration form.”

---

## EXCO experience principles

Optimise for **finding, understanding, reviewing and activating people.**

| # | Principle | Meaning |
| --- | --- | --- |
| 1 | Density with clarity | Scan who registered, needs attention, is complete, awaiting review, verified, directory-visible — without opening every record. |
| 2 | Search is primary | “Who can do X?” — not a passive list. |
| 3 | Review is contextual | Identity, skills, services, business, documents, verification history, visibility together. |
| 4 | Administrative actions are deliberate | Verify, reject, publish, unpublish, request clarification, delete/merge — never accidental one-click. Consequence must be clear. |
| 5 | Not a spreadsheet | Tables are useful; the product is a professional management system. |

Tone: organised, efficient, information-rich, trustworthy, operational.

> “I can understand and activate our professional community.”  
> Not: “I am managing spreadsheets.”

---

## Locked UX decisions (1.1)

| ID | Decision |
| --- | --- |
| A | Registration does **not** require profile completion. User may leave; record remains. |
| B | Professional status is **editable** over time. Not a permanent account type. |
| C | Business profile is **conditional**. |
| D | Job-seeker / employment-seeking information is **conditional**. |
| E | Verification is **separate** from profile completion. |
| F | Directory publication is **separate** from registration and from verification. |

---

## Four core journeys

### 1A Member

**Objective:** Enter the professional database quickly, then progressively build a useful profile.

```text
LANDING → REGISTER → SUCCESS → SECURE ACCESS
  → PROFILE COMPLETION (optional now) → DASHBOARD → UPDATE
  → DIRECTORY / OPPORTUNITIES (as permitted)
```

Profile completion is **not** a hard gate after registration.

| Stage | Purpose |
| --- | --- |
| Landing | Value + Join (secondary: Explore professionals, Sign in) |
| Quick registration | One screen or very short multi-step. Eight core fields. No CAC dump or CV dump on status select. |
| Success | “You’re registered.” Complete now **or** later. Later is not cancel. |
| Secure access | Record-first; profile is ready; passwordless mechanism OPEN (Phase 7). |
| Completion | Guided sections, not a 40-field dump. Sections adapt to classification. |
| Dashboard | Status, next action, visibility, preferences, update path. Useful, not decorative. |
| Update | Status can change (student → employed → business owner, etc.) without re-registration. |

Landing emotional proposition (copy later): connect skills, experience and ambitions to a community that can help you grow and contribute — **not** “Register your professional information.”

### 1B EXCO

**Objective:** Understand and manage the community efficiently.

```text
LOGIN → DASHBOARD → DIRECTORY / PROFESSIONALS → SEARCH
  → PROFILE → REVIEW → ACTION
     (verify / clarify / visibility / other authorised management)
```

- EXCO login must feel like **TNCOD Professionals — EXCO**, not a public sign-in clone. **OPEN DECISION:** dedicated `/exco/sign-in` vs branded `/sign-in` with post-auth routing.
- Dashboard: **needs attention first**, then counts, then quick actions.
- Directory vs Professionals: publication layer vs full internal database (see IA).
- Profile review ≠ credential verification — **not the same button**.
- Actions must name **what** is verified (e.g. professional credential, not “Verify profile”).

### 1C Business owner (extension, not a second product)

```text
Registration → status includes business → business profile
  → business information → CAC as verification info → documents
  → EXCO review → business verification state
```

Documents: submitted for review; **not** automatically verified. Member can see workflow state.

### 1D Job seeker (circumstance, not a second product)

```text
Status includes seeking employment → professional info → experience
  → skills → employment preferences → opportunity preferences
```

No stigma. Optional CV/LinkedIn/portfolio later. Opportunity preferences capture **need**, not only current title.

---

## People change (UX principle)

Professional status is **current situation**, not a permanent label. Same professional identity; circumstances change. Status is profile data, not account type.

---

## Public visitor recommendation (carried into 1.2 as locked IA)

**Public landing + limited public directory discovery + richer authenticated information.**

Exact field matrix remains Phase 13 / field-level privacy. Launch **includes** a public directory of **approved** projections (locked in sitemap 1.2).

---

## Central UX model

```text
JOIN → QUICK REGISTRATION → RECORD CREATED
        ├── complete now ──┐
        └── complete later ┴→ MEMBER PROFILE
                ├── employed / other
                ├── business (+ verification)
                └── seeking work
                        ↓
              PROFESSIONAL DATABASE → CONTROLLED VISIBILITY
                ├── member: my profile
                └── EXCO: search / review / verification / directory
```

---

## 1.1 acceptance (locked)

Member, EXCO, business-owner, and job-seeker journeys defined; registration vs completion separated; status dynamic; verification ≠ completion ≠ publication; member vs EXCO differentiated; mobile-first and progressive/conditional profiles established; core screen **purposes** established. Exact sitemap, routes, inventory, and state architecture belong to later 1.x workstreams.
