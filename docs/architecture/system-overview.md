# System overview

**Status:** Locked direction (Phase 0)  
**Implementation:** Not in this phase. Schema Phase 2. Foundation Phase 4.

---

## What the system is

TNCOD Professionals is a **central professional database** with two primary experiences (member and EXCO) and one controlled output (the directory).

Vercel hosts the application. Supabase provides PostgreSQL, Auth, and Storage. Vercel is **not** the database.

---

## Logical architecture

```text
Next.js (TypeScript)
   │
   ├── Tailwind CSS
   └── shadcn/ui
          │
          ▼
       Supabase
       ├── PostgreSQL   ← system of record
       ├── Auth         ← passwordless member access; EXCO auth
       └── Storage      ← documents, headshots (policy later)
          │
          ▼
        Vercel
```

Supporting libraries (intended, not installed in Phase 0): React Hook Form, Zod, Lucide, Vitest, Playwright. Source on GitHub.

---

## Bounded contexts (conceptual)

| Context | Responsibility |
| --- | --- |
| Identity & access | Record-first registration; later passwordless member access; EXCO authentication; roles |
| Professional profile | Core + conditional sections; profile completeness |
| Business | Optional business entity linked to a member; separate verification |
| Documents | Uploads for CVs, CAC, credentials — private by default |
| Verification | Queues, evidence review, designation — independent of publication |
| Directory | Hybrid visibility; publication controls |
| Operations | EXCO notes, export, basic reporting, audit of important changes |

Do not implement these as microservices. They are documentation boundaries for schema and UI later.

---

## Independent states (architecture rule)

Never one generic `status` for a person.

1. **Profile status:** `registered` | `incomplete` | `complete`
2. **Verification status:** `not_reviewed` | `pending` | `under_review` | `verified` | `needs_clarification` | `rejected`
3. **Directory visibility:** `private` | `members_only` | `directory` | `unpublished`

Business verification uses its own analogous states (`not_submitted` … `rejected`) and must not be overloaded onto person verification.

Claims vs verified designations must be separable in data (Phase 2), not only in UI.

---

## Authentication direction (not implemented)

```text
Member:  register (no password) → record → confirm → passwordless access → enrich
EXCO:    authenticated staff access by role (Phase 10)
```

- Do not use a permanent secret URL as the long-term access control for a profile.
- Exact Auth providers, email templates, and session rules: Phase 3 / 7 / 10.

---

## Starter strategy

```text
Technical starter
   ↓
Remove demo / product assumptions
   ↓
Establish TNCOD architecture
   ↓
Establish TNCOD design system
   ↓
Build custom product
```

**OPEN DECISION (Phase 4):** Specific starter kit.

The starter must not dictate product architecture, data model, UX, navigation, permissions, workflows, or visual identity.

---

## What is explicitly not designed yet

- Table names, keys, RLS policies, storage buckets
- Route map and component tree
- Design tokens and brand system
- Duplicate-merge algorithm
- Migration from historical data sources

Those belong to later phases.
