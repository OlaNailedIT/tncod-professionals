# Product brief — TNCOD Professionals

**Status:** Locked (Phase 0)  
**Product name:** TNCOD Professionals  
**Public-facing directory name:** TNCOD Professionals Directory  
**Internal description:** TNCOD Professionals Platform  
**Audience for this document:** Product owners, EXCO, and future implementation agents

This document is the master **product** reference. **Phase 0 is PASS / LOCKED.**

UX structure (sitemap, routes, screens) lives in `docs/ux/`. If product intent conflicts with UX docs, this brief plus `docs/product/product-scope.md` win. If UX structure conflicts with older journey sketches, `docs/ux/` (1.1–1.3 locked) wins.

---

## Purpose

TNCOD Professionals is a secure professional community platform that helps TNCOD **identify, understand, connect and activate** the professional capacity, businesses, skills, needs and opportunities within its community.

The platform must help TNCOD answer:

1. Who do we have?
2. What do they do?
3. What do they need?
4. What can they offer?
5. How can TNCOD responsibly connect them?

The platform is **not simply a directory**. The directory is one controlled output of the underlying professional database.

---

## Locked product definition

| Item | Decision |
| --- | --- |
| Product | TNCOD Professionals Platform |
| Directory | TNCOD Professionals Directory (hybrid, controlled publication) |
| Participation | Everyone connected to the TNCOD community who wants to participate professionally can register |
| Registration | Record-first; no password during initial registration |
| Later access | Passwordless authentication (magic link and/or OTP; exact method deferred) |
| Classification | Structured profile information — not registration eligibility gates |
| Verification | Distinct from profile existence and from directory publication |
| Privacy | Collection ≠ publication; hybrid directory visibility |
| V1 posture | Smallest useful operational system; future features must not leak into V1 |

---

## Core participation principle

The platform must **not** define “professional” narrowly.

Eligible participants include, but are not limited to:

- Employees
- Entrepreneurs
- Business owners
- Freelancers
- Consultants
- Skilled professionals
- Students/interns
- Job seekers
- People between jobs
- Retired professionals
- Professionals transitioning careers
- Other legitimate professional/community participants

**Lock:** Everyone can join. Structured information determines how they appear, which profile sections apply, and which opportunities are relevant.

Do **not** restrict registration by professional category.

---

## Record lifecycle (conceptual)

```text
REGISTERED
     │
     ▼
PROFILE COMPLETED
     │
     ▼
AVAILABLE IN INTERNAL DATABASE
     │
     ▼
APPROVED FOR DIRECTORY VISIBILITY
     │
     ▼
VERIFIED DESIGNATION
(where applicable)
```

These steps are **not sequential gates**. Independent state combinations are valid. Examples:

- Registered + profile incomplete + available internally + not published + not verified
- Registered + profile complete + available internally + published + not verified
- Registered + profile complete + published + verified

A newly created record is useful to the internal database even when Stage 2 (profile enrichment) is incomplete.

---

## Three independent state dimensions

Do **not** collapse these into one generic `status` field. The database schema is designed in Phase 2; the conceptual rule is locked now.

### Profile status

- `registered`
- `incomplete`
- `complete`

### Verification status

- `not_reviewed`
- `pending`
- `under_review`
- `verified`
- `needs_clarification`
- `rejected`

### Directory visibility

- `private`
- `members_only`
- `directory`
- `unpublished`

**Directory publication is opt-in/controlled, not automatic.** Database collection does not imply publication.

**OPEN DECISION (Phase 2):** Exact storage shape, defaults, transitions, and whether `private` vs `unpublished` remain separate columns or mapped values. The *independence* of the three dimensions is not open.

---

## Verification principle

A member’s submitted claim is **not** automatically a verified credential.

**Not acceptable:** displaying “Certified Accountant ✓” solely because the member typed that title.

**Acceptable:**

- Show the self-described role (e.g. Accountant) without a credential tick; optionally show “Professional profile reviewed ✓” only after EXCO review of the profile.
- Show “Certified Accountant / Verified by TNCOD ✓” only after evidence review against TNCOD verification rules.

This distinction must eventually exist at the **data-model level**, not only in UI copy. UI must never imply verification merely because profile information exists.

---

## Directory model (hybrid)

```text
                    DATABASE
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       PRIVATE      MEMBERS       PUBLIC
          │            │            │
          ▼            ▼            ▼
       EXCO only   Authenticated   Approved
                    members       directory
```

**Public:** limited, approved professional presence (name, profession, business/service category, general location, approved profile summary — as later specified).

**Members-only:** richer professional information, contact options, services, collaboration availability — according to permissions and consent.

**Private:** documents, verification records, admin notes, sensitive contact information.

**OPEN DECISION (Phase 1 / Phase 13):** Exact field-level public vs members-only vs private mapping. The hybrid model and the principle that sensitive fields never publish merely because they exist are locked.

---

## Authentication model

**Locked:** record-first + passwordless access.

```text
Registration
     ↓
Professional record created
     ↓
Confirmation
     ↓
Secure profile access through OTP/magic link
     ↓
Profile completion
```

- Initial registration creates a professional record without password creation, password confirmation, or traditional account setup.
- Later access uses a passwordless mechanism (email magic link, email OTP, or another approved passwordless method).
- Access to a person’s record is **securely controlled**. Do not use an insecure permanent “secret profile URL” as the long-term security mechanism.

**Do not implement authentication in Phase 0.** Exact provider configuration is Phase 4 / Phase 7.

**OPEN DECISION (Phase 7):** Magic link vs OTP vs both; email as primary channel; recovery if email is unavailable.

---

## High-level product architecture

```text
                         TNCOD PROFESSIONALS
                                  │
             ┌────────────────────┴────────────────────┐
             │                                         │
             ▼                                         ▼
       MEMBER EXPERIENCE                         EXCO EXPERIENCE
             │                                         │
       Registration                              Dashboard
             │                                   Directory
       Profile access                            Search
             │                                   Filtering
       Profile completion                        Verification
             │                                   Businesses
       Profile management                        Reports
             │                                         │
             └────────────────────┬────────────────────┘
                                  ▼
                         CENTRAL DATABASE
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
          Profiles            Businesses          Documents
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  ▼
                         CONTROLLED DIRECTORY
```

---

## Technical direction (document only)

Intended stack (not installed in Phase 0):

- Application: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Supabase (PostgreSQL, Auth, Storage)
- Hosting: Vercel (application host — **not** the database)
- Forms/validation: React Hook Form, Zod
- Icons: Lucide
- Tests: Vitest, Playwright
- Source control: GitHub

**Starter strategy:** use a **technical** Next.js + Supabase starter as scaffolding, then remove demo/product assumptions, establish TNCOD architecture and design system, then build the custom product. The starter must not dictate product architecture, data model, UX, navigation, permissions, workflows, or visual identity.

**OPEN DECISION (Phase 4):** Which specific starter repository to use.

---

## Success metrics (conceptual)

**Primary registration metric:** median initial registration completion time ≤ 60 seconds.

Track conceptually (analytics implementation later):

- Registration starts, completions, abandonment, completion rate
- Profile completion rate
- Verification rate
- Directory publication rate
- Duplicate records, incomplete records
- EXCO search usage, profile views
- Verification turnaround

---

## Phase roadmap

| Phase | Purpose |
| --- | --- |
| **0** | Product architecture & specification |
| **1** | UX & information architecture |
| **2** | Data architecture & database schema |
| **3** | Security, permissions & privacy architecture |
| **4** | Technical foundation & repository setup |
| **5** | Design system & visual foundation |
| **6** | Quick registration |
| **7** | Passwordless member access |
| **8** | Profile completion |
| **9** | Conditional business/job-seeker profiles |
| **10** | EXCO authentication & dashboard |
| **11** | Professional directory |
| **12** | Verification centre |
| **13** | Privacy & directory publication controls |
| **14** | Spotlight |
| **15** | Historical data migration |
| **16** | QA / Killcritic |
| **17** | Pilot |
| **18** | Production launch |
| **19** | V1.1 connection features |
| **20** | Future intelligence/matching |

Do not implement a later phase until the current phase is reviewed and accepted.

---

## Related documents

- Scope and non-goals: `docs/product/product-scope.md`
- Principles: `docs/product/product-principles.md`
- Roles: `docs/product/user-roles.md`
- System overview: `docs/architecture/system-overview.md`
- Implementation governance: `docs/architecture/implementation-governance.md`
- Domain (conceptual): `docs/architecture/domain-model.md`
- Construction contract: `docs/architecture/component-system-architecture.md`
- Security principles: `docs/security/security-principles.md`
- Acceptance criteria: `docs/qa/acceptance-criteria.md`
