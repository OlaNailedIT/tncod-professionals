# Phase 1.4 — Screen inventory

**Status:** LOCKED (structurally)  
**Depends on:** `route-architecture.md` (1.3 LOCKED)  
**Next:** `navigation-architecture.md` (1.5)

A **route** is not automatically a screen. A **screen** does not automatically justify another route.

This file is the authoritative inventory of **interface surfaces**. Visual design, field schema, and component library are later phases.

---

## 1.4.1 Classification (A–G)

| Class | Meaning | Becomes a route? |
| --- | --- | --- |
| **A — Full screen** | Destination with its own primary job | Usually yes |
| **B — Detail screen** | One identifiable record | Dynamic route where 1.3 established it |
| **C — Internal section** | Part of an existing screen | No (query/internal state) |
| **D — Panel / drawer** | Contextual, not a destination | No |
| **E — Modal / confirmation** | Focused interruption | No |
| **F — System state** | Loading, empty, error, unauthorized, unavailable, success | Rarely a dedicated route |
| **G — Transition** | Temporary workflow state | Optional; not a permanent destination unless required |

---

## 1.4.2 Inventory rules

1. **Every screen has a job.** If “why does this exist?” has no answer, it does not exist yet.  
2. **No screens for data categories.** Skills, services, documents, CAC, job seeking are not pages.  
3. **No screens for workflow steps by default.** Completion, verification, publication live inside existing screens.  
4. **Reuse screens across states.** Incomplete / complete / verified / unpublished are **states**, not four profile pages.  
5. **Every screen has an owner:** PUBLIC · MEMBER · EXCO · SYSTEM.

---

## 1.4.3 Count correction

Earlier sketches said “8 EXCO screens.” The 1.3 route contract has **nine** EXCO destinations. Authoritative count:

| Context | Canonical route-level screens |
| --- | ---: |
| Public | 5 |
| Member | 5 |
| EXCO | 9 |
| **Total** | **19** |

Supporting panels, modals, sections, transitions, and system states are **not** extra canonical screens.

---

## 1.4.4 Screen vs route matrix

| Route | Screen ID | Route-level screen | Internal (not extra routes) |
| --- | --- | --- | --- |
| `/` | PUB-01 | Home | Hero, value, CTAs |
| `/professionals` | PUB-02 | Directory | Search, filters, results |
| `/professionals/[slug]` | PUB-03 | Public profile | Profile sections; unavailable state |
| `/register` | PUB-04 | Registration | Form, validation; success as **G** then `/dashboard` |
| `/sign-in` | PUB-05 | Sign in | Auth states; access-in-progress **G** |
| `/dashboard` | MEM-01 | Dashboard | Cards, prompts, first-time |
| `/profile` | MEM-02 | Profile | Sections, visibility, preview |
| `/profile/edit` | MEM-03 | Profile editor | About, professional, skills, experience, opportunities, business, links, visibility |
| `/opportunities` | MEM-04 | Opportunities | Seeking, offering |
| `/settings` | MEM-05 | Settings | Account / preferences |
| `/exco` | EXCO-01 | EXCO dashboard | Attention, metrics, quick actions |
| `/exco/professionals` | EXCO-02 | Professionals | Search / filter / results |
| `/exco/professionals/[id]` | EXCO-03 | Professional record | Operational panels |
| `/exco/businesses` | EXCO-04 | Businesses | Search / filter / results |
| `/exco/businesses/[id]` | EXCO-05 | Business record | Operational panels |
| `/exco/verification` | EXCO-06 | Verification | Queue / status filters |
| `/exco/directory` | EXCO-07 | Directory | Publication states |
| `/exco/reports` | EXCO-08 | Reports | Report / filter state |
| `/exco/settings` | EXCO-09 | EXCO settings | Settings sections |

**Reconciliation with 1.1:** “You’re registered / complete now or later” is **not** a 20th canonical route. It is a **G** (inline on PUB-04 and/or first-time MEM-01). 1.5 locks post-register destination as `/dashboard`. Do not add `/register/success` or `/complete-profile` unless a later phase proves they are necessary.

**Mobile:** one conceptual screen → responsive presentation. No `/exco-mobile`, no duplicate mobile screen IDs.

---

## 1.4.5 Specification matrix — Public

### PUB-01 — Home

| Field | Specification |
| --- | --- |
| Class | A |
| Route | `/` |
| Context / user | Public / everyone |
| Purpose | Introduce TNCOD Professionals; drive Explore and Join; Sign in for existing members |
| Entry | Direct, shared, post sign-out |
| Primary goal | Understand what this is and choose next action |
| Primary CTA | Join TNCOD Professionals → `/register` |
| Secondary | Explore professionals → `/professionals`; Sign in → `/sign-in` |
| Information | Identity, concise value proposition, who it is for, what members can do, directory entry, join pathway, trust/context. Inclusive language. |
| Components (conceptual) | Public shell, hero, value blocks, CTAs; optional dynamic directory teaser |
| Conditional | Authenticated visitor: optional “Go to dashboard” without turning Home into a dashboard |
| Permissions | Public |
| Navigation | Brand, Professionals, Register, Sign in |
| Back | Browser; logo = home |
| Loading | If dynamic teaser exists |
| Empty | N/A for static; teaser may be empty without implying the internal database is empty |
| Error | Dynamic section retry; rest of page usable |
| Success | — |
| Unauthorized | — |
| Not found | — |
| Mobile | Single column; CTA early; no dense tables |
| Related | PUB-02, PUB-04, PUB-05 |
| Must not | Dashboard preview; eligibility quiz; EXCO metrics |
| Dependencies | Public copy; optional approved-directory teaser (OPEN whether Home shows samples) |

### PUB-02 — Public professionals directory

| Field | Specification |
| --- | --- |
| Class | A |
| Route | `/professionals` |
| Purpose | Discover professionals **currently approved** for public directory visibility |
| Entry | Home, SEO, share, in-app |
| Primary goal | Find a relevant published professional |
| Primary CTA | View profile → PUB-03 |
| Secondary | Search, filter, clear filters; Join; Sign in |
| Information | Public projection only: name, title/field, org/business if public, location if public, skills/services if public, image if public. Exact field matrix OPEN (Phase 13). |
| Privacy | Never: private fields, EXCO notes, verification evidence, internal statuses, unpublished members |
| URL state | Search/filter addressable (param names OPEN) |
| Loading | Result skeletons |
| Empty | **No directory professionals** vs **no search matches** (different copy) |
| Error | Retry |
| Not found | — (this is a list) |
| Mobile | Cards; progressive filters |
| Related | PUB-01, PUB-03 |
| Must not | Internal database browser |

### PUB-03 — Public professional profile

| Field | Specification |
| --- | --- |
| Class | B |
| Route | `/professionals/[slug]` |
| Purpose | Approved public representation of one professional — **not** `/profile` |
| Entry | Directory, share, EXCO preview |
| Primary goal | Understand who they are and what they do |
| Primary CTA | OPEN — Contact/Connect only if public content model allows; never dump private phone by default |
| Secondary | Back to professionals; Join |
| Information | Only approved fields: name, title, image, summary, skills/services, experience, public business, public links, public contact pathway if approved. Trust marks only with defined meaning. |
| Loading | Skeleton |
| Empty | — |
| Error | Retry |
| Success | — |
| Unauthorized | — |
| Not found / unavailable | Generic **profile unavailable**; must not reveal unpublished-but-exists |
| Navigation | Contextual back to `/professionals` (preserve query if came from filtered directory when practical) |
| Mobile | Linear sections; simpler back |
| Related | PUB-02; EXCO-07 preview uses **this** projection |
| Must not | Second public-profile product; member chrome; EXCO notes |

### PUB-04 — Registration

| Field | Specification |
| --- | --- |
| Class | A |
| Route | `/register` |
| User | Prospective member |
| Purpose | Create the professional **record** (Stage 1 only) |
| Entry | Home, Sign in “new here”, campaigns |
| Primary goal | Complete registration quickly (30–60s) |
| Primary CTA | Create profile / Join (copy OPEN) |
| Secondary | Sign in; cancel/back |
| Information | Stage 1 fields only (`docs/product/product-scope.md`). Purpose copy on thoughtful fields. |
| Conditional | Status does not spawn CAC/CV walls |
| Loading | Submit in progress |
| Empty | Fresh form |
| Error | Validation; submission error; retry; duplicate handling OPEN (Phase 2/7) |
| Success | **G** then `/dashboard` (1.5). First-time dashboard carries complete-now vs later. |
| Unauthorized | Already signed in: do not double-register — path to dashboard (copy OPEN) |
| Mobile | One screen or very short steps — not eight pages |
| Related | PUB-05, MEM-01, MEM-03 |
| Must not | Become the full profile editor |

### PUB-05 — Sign in

| Field | Specification |
| --- | --- |
| Class | A |
| Route | `/sign-in` |
| User | Existing member (EXCO may share this surface with distinct tone — OPEN URL in 1.3) |
| Purpose | Passwordless secure access |
| Entry | Public nav, protected-route redirect |
| Primary goal | Enter member or EXCO environment |
| Primary CTA | Sign in (send link/code — mechanism Phase 7) |
| Secondary | Join → `/register` |
| Return | Preserve `returnTo` when safe |
| Loading | Authentication in progress (**G**) |
| Empty | Form |
| Error | Validation; auth failure (enumeration rules Phase 3) |
| Success | `/dashboard` or `returnTo`; EXCO → `/exco` if role is EXCO |
| Already authenticated | Avoid pointless form (redirect or interstitial — OPEN) |
| Related | MEM-01, EXCO-01 |
| Must not | Password creation; merged with register |

---

## 1.4.6 Specification matrix — Member

Member shell owns Dashboard, Profile, Opportunities, Settings. Editor is **not** primary nav.

### MEM-01 — Member dashboard

| Field | Specification |
| --- | --- |
| Class | A |
| Route | `/dashboard` |
| Purpose | Overview of participation and **next useful action** |
| Entry | Post-register, post-sign-in, nav, default member home |
| Primary goal | “What should I do next?” |
| Primary CTA | Contextual: Complete profile / Review profile / Explore opportunities |
| Secondary | Profile, Opportunities, Settings |
| Information | Welcome/identity; completion guidance (not shame); directory visibility as independent fact; key status; opportunities summary; prompts; important activity; clarification requests if any |
| Conditional | Incomplete → complete prompt; complete → review prompt; first-time welcome |
| Loading / empty / error | Skeleton; first-time is valid empty-ish; retry |
| Success | — |
| Unauthorized | → PUB-05 + returnTo |
| Must not | Full editor; full opportunities duplicate; EXCO directory; social feed |
| Related | MEM-02, MEM-03, MEM-04 |

### MEM-02 — My profile

| Field | Specification |
| --- | --- |
| Class | A |
| Route | `/profile` |
| Purpose | **View** current professional identity |
| Primary CTA | Edit profile → MEM-03 |
| Secondary | Public preview if published; visibility; opportunities — only if justified |
| Information | Identity, professional, summary, skills/services, experience, opportunities, business (conditional), links, visibility. Verification labels are distinct from typed titles. |
| Empty | Sparse profile valid |
| Related | MEM-03, PUB-03 (preview), MEM-04 |
| Must not | 40-field editor on this route |

### MEM-03 — Profile editor

| Field | Specification |
| --- | --- |
| Class | A + **C** sections |
| Route | `/profile/edit` (`?section=` optional) |
| Purpose | Create, update, manage professional information (including completion) |
| Primary CTA | Save |
| Secondary | Save & continue; cancel/back; preview; other section |
| Sections (C) | About; Professional; Skills & services; Experience; Opportunities; Business (conditional); Links; Visibility |
| Conditional | Business by circumstance; seeking/offering adapt opportunities; status editable (not account type) |
| States per section | Loading; existing data; empty/incomplete; validation; saving; saved; save failure; unsaved; leave confirm (**E**) |
| After save | Remain in editor (1.5) |
| Mobile | Section list then one section; not shrunk desktop sidebar |
| Related | MEM-01, MEM-02 |
| Must not | Nested routes per section in V1; publish-on-save; verify-on-save |

### MEM-04 — Opportunities

| Field | Specification |
| --- | --- |
| Class | A |
| Route | `/opportunities` |
| Purpose | What I am looking for + what I can offer |
| Primary CTA | Save / update opportunities |
| Information | Seeking, offering, availability/context (fields later). Not a marketplace. |
| States | Empty/new; existing; saving; saved; validation; save failure |
| After save | Remain here |
| Related | MEM-01, MEM-02, MEM-03 opportunities section (summary vs this primary home) |

### MEM-05 — Settings

| Field | Specification |
| --- | --- |
| Class | A |
| Route | `/settings` |
| Purpose | Narrow account-level controls |
| Potential sections (C) | Account; Notifications (OPEN — V1 may be minimal/absent); Privacy/visibility **pointer** to editor; Access; Sign out |
| Must not | Catch-all; EXCO admin; taxonomies |
| After save | Remain here |

---

## 1.4.7 Specification matrix — EXCO

One EXCO environment. Roles change **actions**, not a second route tree.

### EXCO-01 — EXCO dashboard

| Field | Specification |
| --- | --- |
| Class | A |
| Route | `/exco` |
| Purpose | Operational overview; **needs attention first** |
| Hierarchy | Attention → overview → quick actions |
| Information | Pending verification; incomplete profiles; directory items needing attention; totals; recent activity; alerts — counts as **independent** dimensions |
| Primary actions | Contextual: verification, professionals, directory, reports |
| Empty | Queue clear is valid (“up to date”) |
| Unauthorized | Yes |
| Related | All EXCO workspaces |

### EXCO-02 — Professionals workspace

| Field | Specification |
| --- | --- |
| Class | A |
| Route | `/exco/professionals` |
| Purpose | Internal professional database + discovery |
| Core | Search, filters, results, record open |
| Information | Person; completeness; verification state; directory state; category; business relationship; operational indicators |
| URL state | Preserve filters |
| Empty | No records vs no matches |
| Child | EXCO-03 |
| Must not | Published-only list; same as EXCO-07 |

### EXCO-03 — Professional operational record

| Field | Specification |
| --- | --- |
| Class | B + **D** panels |
| Route | `/exco/professionals/[id]` |
| Purpose | Complete operational view; view **and** permitted management |
| Panels (D) | Overview; verification; documents; business; visibility; activity |
| Actions | Review; verify **named** claim; request clarification; publish/unpublish; permitted edit; public preview |
| After most actions | Remain on record; verification **completed** decision → return to queue (1.5/1.6). Needs clarification may stay on record. |
| Not found | Internal not-found (not public unavailable copy) |
| Unauthorized | Yes |
| Must not | Public URL; generic unlabeled Verify; second “verification identity” |

### EXCO-04 — Businesses workspace

| Field | Specification |
| --- | --- |
| Class | A |
| Route | `/exco/businesses` |
| Purpose | Business discovery/management — not a CRM |
| Child | EXCO-05 |
| URL state | Filters e.g. pending |
| Privacy | Screen existence ≠ public visibility |

### EXCO-05 — Business operational record

| Field | Specification |
| --- | --- |
| Class | B + D |
| Route | `/exco/businesses/[id]` |
| Purpose | Operational business: identity, related professional, registration, documents, verification, publication, activity |
| Actions | Review; verify named business claim; clarification; publication; permitted updates |
| Related | EXCO-03 (person), EXCO-06, EXCO-07 |

### EXCO-06 — Verification workspace

| Field | Specification |
| --- | --- |
| Class | A (workflow) |
| Route | `/exco/verification` |
| Purpose | Process verification work |
| Interface | Queue, filters, status, items |
| Filter states | Pending; under review; needs clarification; verified; rejected |
| Select item | → EXCO-03 or EXCO-05 with verification context. **No** `/exco/verification/[id]` in V1 |
| Empty | Queue clear vs filtered empty |
| Related | EXCO-03, EXCO-05 |

### EXCO-07 — Directory management

| Field | Specification |
| --- | --- |
| Class | A |
| Route | `/exco/directory` |
| Purpose | Control **publication** (not who exists) |
| Conceptual publication states | Not published; pending publication; published; unpublished (align with Phase 2 enum — OPEN exact labels) |
| Actions | Publish; unpublish; preview public profile (**PUB-03**, labelled preview) |
| Must not | Replace EXCO-02 |

### EXCO-08 — Reports

| Field | Specification |
| --- | --- |
| Class | A |
| Route | `/exco/reports` |
| Purpose | Network-level operational reporting — observe, do not create operational states |
| Categories (OPEN scope) | Completion; directory; verification; categories; businesses |
| URL state | Optional `?report=` — not nested report routes in V1 |
| Must not | BI platform |

### EXCO-09 — EXCO settings

| Field | Specification |
| --- | --- |
| Class | A |
| Route | `/exco/settings` |
| Purpose | Role-aware administrative configuration |
| Potential (C) | EXCO config; directory settings; workflow settings; access/roles |
| Viewer | Limited/none |
| Admin | Administrative controls as specified later |
| Super Admin | Broader system controls |
| Honesty | Do not invent taxonomies/config products without requirements |

---

## 1.4.8 Supporting surfaces (not canonical screens)

### Registration / authentication (G / F)

Registration success (inline or first-time dashboard); authentication loading; authentication error; already authenticated.

### Profile

Completion indicator; visibility indicator; public preview; save confirmation; unsaved changes (**E**); discard changes (**E**).

### Public directory

Search/filter controls; no-results; unavailable-profile (**F** on PUB-03).

### EXCO

Verification review panel (**D**); publication confirm (**E**); unpublish confirm (**E**); verification decision confirm (**E**); request clarification (**D/E**); record action menu; public preview; mobile nav drawer (**D**).

Delete/merge confirm: OPEN (Phase 3). Same **E** pattern if introduced.

---

## 1.4.9 System states (F) — design consistently

| State | Rule |
| --- | --- |
| Loading | No blank page; avoid unexplained layout jump |
| Empty | First-use ≠ filtered empty |
| Error | What happened; whether data was affected; what to do next |
| Unauthorized | Authenticated, insufficient permission; safe destination; no sign-in loop |
| Not found | Route or **internal** record missing |
| Public unavailable | Shared slug no longer public; privacy-safe |
| Success | Confirm without unnecessarily relocating the user (except queue return after completed verification) |

---

## 1.4.10 State audit requirement (not final 1.6 design)

| Screen | Loading | Empty | Error | Success | Unauthorized | Not found |
| --- | --- | --- | --- | --- | --- | --- |
| PUB-01 Home | ✓ | — | ✓ | — | — | — |
| PUB-02 Directory | ✓ | ✓ | ✓ | — | — | — |
| PUB-03 Public profile | ✓ | — | ✓ | — | — | ✓ / unavailable |
| PUB-04 Register | ✓ | — | ✓ | ✓ | — | — |
| PUB-05 Sign in | ✓ | — | ✓ | ✓ | — | — |
| MEM-01 Dashboard | ✓ | ✓ | ✓ | — | — | — |
| MEM-02 Profile | ✓ | ✓ | ✓ | — | — | — |
| MEM-03 Editor | ✓ | ✓ | ✓ | ✓ | — | — |
| MEM-04 Opportunities | ✓ | ✓ | ✓ | ✓ | — | — |
| MEM-05 Settings | ✓ | — | ✓ | ✓ | — | — |
| EXCO-01 Dashboard | ✓ | ✓ | ✓ | — | ✓ | — |
| EXCO-02 Professionals | ✓ | ✓ | ✓ | — | ✓ | — |
| EXCO-03 Professional | ✓ | — | ✓ | ✓ | ✓ | ✓ |
| EXCO-04 Businesses | ✓ | ✓ | ✓ | — | ✓ | — |
| EXCO-05 Business | ✓ | — | ✓ | ✓ | ✓ | ✓ |
| EXCO-06 Verification | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| EXCO-07 Directory | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| EXCO-08 Reports | ✓ | ✓ | ✓ | — | ✓ | — |
| EXCO-09 Settings | ✓ | ✓ | ✓ | ✓ | ✓ | — |

---

## 1.4.11 View vs manage vs workflow

| Pattern | Example |
| --- | --- |
| VIEW | MEM-02 `/profile` |
| MANAGE | MEM-03 `/profile/edit` |
| VIEW + OPERATIONAL MANAGEMENT | EXCO-03, EXCO-05 |
| WORKFLOW QUEUE | EXCO-06 |

---

## 1.4.12 Rejected screens

No standalone: complete profile; skills; services; experience; documents; verification detail; job seeker; business owner; verified professionals; published professionals; `/admin`; mobile duplicates.

---

## 1.4.13 Relationships (canonical)

```text
HOME → PROFESSIONALS → PUBLIC PROFILE
HOME → REGISTER → (G) → DASHBOARD → PROFILE EDITOR or stay
HOME → SIGN IN → DASHBOARD or returnTo

DASHBOARD → PROFILE → PROFILE EDITOR
DASHBOARD → OPPORTUNITIES
DASHBOARD → SETTINGS

EXCO DASHBOARD → PROFESSIONALS → RECORD (panels: verification, business, visibility, preview)
                 → BUSINESSES → RECORD
                 → VERIFICATION → relevant RECORD
                 → DIRECTORY → record / PUB-03 preview
                 → REPORTS
                 → SETTINGS
```

---

## 1.4.14 Open (do not invent)

Public contact CTA; Home featured professionals; EXCO sign-in URL vs branded `/sign-in`; query param names; slug rules; duplicate registration UX; member notifications product; EXCO-09 V1 contents; exact publication enum labels vs Phase 0 visibility list.

---

## PHASE 1.4 STATUS: PASS / LOCKED (structure and 19-screen matrix)

Implementation of UI is **not** authorised.
