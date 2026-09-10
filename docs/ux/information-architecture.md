# Phase 1.2 — Information architecture and sitemap

**Status:** LOCKED  
**Depends on:** `experience-principles.md`  
**Next:** `route-architecture.md`

The sitemap reflects **user goals**. The database stays invisible.

---

## Three experience layers

| Layer | Job |
| --- | --- |
| **Public** | Discover → Understand → Join → Explore **approved** professionals |
| **Member** | Manage → Enrich → Control → Participate |
| **EXCO** | Understand → Find → Review → Verify → Manage |

Do not force one navigation system to serve everyone.

---

## Canonical product tree

```text
TNCOD PROFESSIONALS
│
├── PUBLIC
│   ├── Home
│   ├── Professionals
│   │   └── Professional profile (public projection)
│   ├── Register
│   └── Sign in
│
├── MEMBER
│   ├── Dashboard
│   ├── My profile
│   │   └── Profile editor
│   │       ├── About
│   │       ├── Professional
│   │       ├── Skills & services
│   │       ├── Experience
│   │       ├── Opportunities
│   │       ├── Business [conditional]
│   │       ├── Links
│   │       └── Visibility
│   ├── Opportunities
│   └── Settings
│
└── EXCO
    ├── Dashboard
    ├── Professionals
    │   └── Professional profile (operational)
    ├── Businesses
    │   └── Business profile
    ├── Verification
    │   └── Verification review (contextual on record)
    ├── Directory
    ├── Reports
    └── Settings
```

---

## Locked IA decisions

| Decision | Rule |
| --- | --- |
| No `/about` in V1 | Landing carries enough context unless content later justifies a page. |
| No `/complete-profile` | Dashboard CTA → `/profile/edit` (section targeting). One source of truth. |
| No job-seeker / student / freelancer products | Circumstance on the professional record. |
| No standalone business registration | Business extends one professional identity. |
| No top-level Skills, Services, CAC, Documents, Admin notes, Verified Professionals | Attributes, taxonomies, or workflows — not destinations. |
| Opportunities | Member **preferences** (seek / offer), not a job marketplace in V1. |
| Business (member) | Inside profile, not top-level nav. |
| Professionals vs Directory (EXCO) | Internal database vs publication layer. |
| Business entity | Related to the person; not the same object. V1 need not support every multi-business case, but IA must not fuse person and business. |
| Taxonomies | Data, not routes (`/accountants` rejected). |

---

## Working route map (UX, not Next.js)

| Experience | Route | Purpose |
| --- | --- | --- |
| Public | `/` | Landing |
| Public | `/professionals` | Approved directory |
| Public | `/professionals/[slug]` | Public professional projection |
| Public | `/register` | Quick registration |
| Public | `/sign-in` | Passwordless member access |
| Member | `/dashboard` | Member home |
| Member | `/profile` | Own profile (view) |
| Member | `/profile/edit` | Profile editor |
| Member | `/opportunities` | Seek / offer preferences |
| Member | `/settings` | Personal settings |
| EXCO | `/exco` | EXCO dashboard |
| EXCO | `/exco/professionals` | Internal professional database |
| EXCO | `/exco/professionals/[id]` | Full operational record |
| EXCO | `/exco/businesses` | Business records |
| EXCO | `/exco/businesses/[id]` | Business record |
| EXCO | `/exco/verification` | Verification queue |
| EXCO | `/exco/directory` | Publication management |
| EXCO | `/exco/reports` | Reports / export |
| EXCO | `/exco/settings` | EXCO administration |

Not every path is a separate rendered page. Nested editor paths in earlier drafts are **sections**, not committed pages (see 1.3).

---

## Navigation direction

**Public:** Logo, Professionals, Join, Sign in. Minimal.

**Member primary:** Dashboard, My profile, Opportunities. Secondary: Settings, Sign out.

**Member mobile:** bottom nav — Home | Profile | Opps | More.

**EXCO desktop:** persistent sidebar — Dashboard, Professionals, Businesses, Verification, Directory, Reports, Settings.

**EXCO small screens:** header + drawer. Do not reuse member bottom nav.

**Global:** one primary home per concept. Summaries may appear elsewhere (e.g. dashboard completion card) without duplicating editors.

---

## Search (system pattern, not a sitemap node)

Same conceptual search, three result projections: public (approved), member (permitted), EXCO (operational). Permissions bound results.

---

## Core object

```text
PROFESSIONAL
  ├── Professional information
  ├── Business (related entity)
  ├── Opportunities & needs
  ├── Visibility (publication)
  └── Verification (workflow / state)
```

---

## Goal test (every area)

| Area | User goal |
| --- | --- |
| Home | Understand TNCOD Professionals |
| Professionals | Discover people |
| Public profile | Understand one **published** professional |
| Register | Join |
| Sign in | Access existing profile |
| Dashboard | Know what to do next |
| My profile | Understand / manage identity |
| Profile editor | Improve / update information |
| Opportunities | Manage what I seek and offer |
| EXCO dashboard | Know what needs attention |
| EXCO Professionals | Find / manage people |
| EXCO Businesses | Find / manage businesses |
| Verification | Review claims / evidence |
| Directory | Control publication |
| Reports | Understand the network |
| Settings | Manage account or system |
