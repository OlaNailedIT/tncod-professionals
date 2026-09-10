# Phase 1.3 — Route architecture and navigation behaviour

**Status:** LOCKED  
**Depends on:** `information-architecture.md`  
**Next:** `screen-inventory.md`

A sitemap says a route exists. This document says **who may enter, which shell owns it, how they arrive/leave, and what happens when access or data conditions change.**

This is a **UX routing contract**, not a Next.js file map.

---

## Principles

1. **URLs follow experience boundaries** (`/`, `/dashboard`, `/exco/...`). No `/database/professionals`.
2. **Authentication ≠ authorization.** Signed-in members do not get EXCO routes.
3. **Public routes stay meaningful** even if the visitor is already authenticated (do not auto-force dashboard from `/`).
4. **Query string = view state** (search, filters, editor section). Identity belongs in the path (`[slug]`, `[id]`), not `?id=`.
5. **Deep links work**, subject to auth, authz, visibility, and existence.
6. **Preserve list/filter state** when returning from an EXCO record.
7. **Workflows are not top-level nav** (registration, verification, completion, publication).

---

## Route groups

**Public:** `/` `/professionals` `/professionals/[slug]` `/register` `/sign-in`

**Member (authenticated member):** `/dashboard` `/profile` `/profile/edit` `/opportunities` `/settings`

**EXCO (authorised EXCO):** `/exco` `/exco/professionals` `/exco/professionals/[id]` `/exco/businesses` `/exco/businesses/[id]` `/exco/verification` `/exco/directory` `/exco/reports` `/exco/settings`

**System / transition:** registration success, access verification (magic link/OTP), not found, unauthorized, error — **not all are permanent URLs**.

---

## Access matrix (UX, not final RLS)

| Route | Owner | Access |
| --- | --- | --- |
| `/` `/professionals` `/register` `/sign-in` | Public | Everyone |
| `/professionals/[slug]` | Public | Everyone **if published**; otherwise public-safe unavailable |
| Member routes | Member | Authenticated member (own data) |
| `/exco/*` | EXCO | Authorised EXCO role |

### Role × area (UX)

| Area | Member | EXCO Viewer | EXCO Admin | Super Admin |
| --- | --- | --- | --- | --- |
| Member dashboard / own profile | ✓ | — | — | — |
| EXCO dashboard, Professionals, Businesses | — | ✓ | ✓ | ✓ |
| Verification, Directory | — | View | Manage | Manage |
| Reports | — | View | ✓ | ✓ |
| EXCO settings | — | Limited/none | ✓ | ✓ |
| Role / system administration | — | — | Limited | ✓ |

Final enforcement: Phase 3.

---

## Canonical destinations

| Concept | Canonical |
| --- | --- |
| Public home | `/` |
| Member home | `/dashboard` (no `/member`) |
| EXCO home | `/exco` (no `/exco/dashboard`, no `/admin`) |
| Profile view vs edit | `/profile` vs `/profile/edit` |
| Public professional | `/professionals/[slug]` |
| Internal professional | `/exco/professionals/[id]` |

Rejected duplicates: `/member`, `/complete-profile`, `/job-seekers`, `/business-registration`, `/students`, `/freelancers`, `/verified-professionals`, `/skills`, `/services`, `/documents`, `/admin`.

---

## Public behaviour

- `/professionals` returns **directory projections** only — never unpublished records, notes, evidence, or private contacts.
- Unpublished / removed public slug → **Profile unavailable** (generic). Do **not** disclose “exists but unpublished.” Do **not** redirect to the private member profile.
- `/register` does not branch into `/register/business` etc.
- Registration success: **Complete my profile** → `/profile/edit`; **I’ll do this later** → `/dashboard` after access is established. Later ≠ cancel.
- Exact success URL (`/register/success` vs in-flow state): **OPEN DECISION** (screen inventory treats success as a required **screen**, URL optional).
- Authenticated visit to `/sign-in`: avoid a pointless form (go to dashboard or “already signed in”). **OPEN DECISION:** redirect vs interstitial.

---

## Auth transitions

- Unauthenticated → protected route → `/sign-in` with **returnTo** preserved where safe.
- Authenticated but unauthorized (e.g. member → `/exco`) → **Access denied**, not another sign-in loop. Safe CTA: return to `/dashboard`.
- Distinguish: route 404 vs record not found vs public unavailable.

---

## Member behaviour

- Shared **member shell** (identity, nav, sign out). Screens do not invent their own primary nav.
- Default after member auth: `/dashboard`.
- Editor sections: **query state** (`/profile/edit?section=skills`), not nested routes, unless a later UX review requires them.
- Save stays in the editor; Cancel/major nav leaves. Unsaved-change protection is a **global rule**; copy/implementation in 1.4 / later.
- After save, return to **entry context** (dashboard→dashboard, profile→profile) when that context is known.
- `/opportunities` is first-class (seek + offer). Not a marketplace.
- `/settings` stays narrow (account, notifications as later allowed, privacy pointers, access, sign out). Not a feature dump.
- Business / job-seeker: **conditional sections**, not global nav changes. If status leaves business ownership, do not force the section as mandatory; existing data lifecycle is Phase 2.

---

## EXCO behaviour

- Separate **EXCO shell** (sidebar desktop; drawer on small screens).
- List search/filters in the **URL**. No `/exco/professionals/accountants`.
- Record sections: panels/tabs + optional `?panel=` — not duplicate person URLs.
- **No** `/exco/verification/[id]` as canonical record. Queue → professional or business record → verification panel.
- Directory ≠ Professionals. Public **preview** shows what the public sees; clear “this is the public view” + back to directory. Preserve filter state on back.
- After **completed** verification (verify/reject): **return to the verification queue** (1.5/1.6). If the outcome is needs clarification, the record may remain open. After unpublish/publish on a record: remain on the record. Confirmations for consequential actions (1.4).
- Settings: show only what the role may change.

---

## Identifiers

| Context | Segment | Meaning |
| --- | --- | --- |
| Public | `[slug]` | Shareable public identity |
| EXCO | `[id]` | Stable internal id |

Public identity ≠ internal record identity.

**OPEN DECISION (later):** slug generation, rename, and collision rules.

---

## Breadcrumbs and back

- Public/member: breadcrumbs optional; hierarchy should work without them.
- EXCO: breadcrumbs on records (`Professionals → Name`). Contextual back restores query state.

---

## Locked 1.3 decisions (summary)

1. Public / member / EXCO contexts stay separate.  
2. `/dashboard` and `/exco` are canonical homes.  
3. `/profile` view; `/profile/edit` edit.  
4. No standalone complete-profile route.  
5. Editor sections = query/internal state.  
6. Business and job-seeker = conditional pathways.  
7. Filters = query params.  
8. Public `[slug]` vs EXCO `[id]`.  
9. Verification is a workflow on the record, not a second identity.  
10. Directory is publication management, separate from Professionals.  
11. Public visibility governed by directory state.  
12. Unauthenticated vs unauthorized are different.  
13. Deep links respect authz and visibility.  
14. EXCO nav ≠ member nav.  
15. Member mobile compact nav; EXCO administrative nav.  
16. No generic `/admin`.  
17. No separate product routes for job seekers, students, freelancers, skills, services, CAC, or documents.

---

## Still open (do not invent)

Exact auth mechanism; final authorization matrix; query parameter names; public-directory **field** scope; slug strategy; unsaved-change implementation; destructive-action copy; document-access rules; EXCO sign-in URL; registration-success URL; authenticated `/sign-in` exact behaviour.
