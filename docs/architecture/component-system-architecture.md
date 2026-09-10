# Phase 1.8 — Component and system architecture

**Status:** LOCKED as a **construction contract** (how to assemble UI and logic)  
**Not:** permission to implement the app, install the starter, or add dependencies  
**Depends on:** 19 screens, navigation shells, workflows, conceptual domain model  
**Implementation calendar:** Phase 0 roadmap **Phases 4–16** (foundation, design system, then features). Do **not** relabel that work “Phase 2.”

Phase 0 stack remains: Next.js, TypeScript, Tailwind, shadcn/ui, Supabase (Postgres, Auth, Storage), React Hook Form, Zod, Lucide, Vitest, Playwright, Vercel, GitHub.

---

## 1.8.1 Engineering principles

1. **Compose pages from domains**, do not duplicate fetch/permission/business logic in every route file.  
2. **One job per component.** Pages compose cards, tables, actions.  
3. **Four layers:** presentation → application logic → data access → backend (Supabase / server).  
4. **Share when a pattern is stable and repeated** — no `UniversalEverythingCard`.  
5. **Minimize dependencies.** New libraries (TanStack Query, Zustand, etc.) are **OPEN for Phase 4**, not locked here.

---

## 1.8.2 Three shells

| Shell | Job | Layout idea |
| --- | --- | --- |
| Public | Discover and join | Header, nav, main, footer |
| Member | Identity and participation | Sidebar or drawer, header, account menu, content |
| EXCO | Operations | EXCO nav, workspace header, record context, content |

Each shell owns navigation, layout, access rules, shared patterns. Visual design is **Phase 5**.

Conceptual components: `PublicHeader`, `PublicFooter`, `MemberSidebar`, `MemberHeader`, `AccountMenu`, `MobileNavigationDrawer`, `ExcoSidebar`, `WorkspaceHeader`, `WorkspaceActions`, `RecordContextBar`.

Routes per shell: see `docs/ux/route-architecture.md` (19 screens).

---

## 1.8.3 Target folder shape (when code exists)

Illustrative — **do not create in Phase 1**:

```text
src/
├── app/                 # Next.js routes only: compose features
├── layouts/             # Public / Member / EXCO shells
├── components/
│   ├── ui/              # shadcn / primitives
│   ├── layout/
│   └── shared/          # EmptyState, PermissionGate, etc.
├── features/
│   ├── auth/
│   ├── professionals/
│   ├── profile/
│   ├── businesses/
│   ├── opportunities/
│   ├── verification/
│   ├── directory/
│   └── reports/
├── lib/                 # API client / Supabase client (Phase 4)
├── types/
├── validators/          # Zod
└── utils/
```

Each feature may contain `components/`, hooks, services, types, validators.

Pages **compose** feature modules; they are not where SQL or permission policy lives.

---

## 1.8.4 Component hierarchy

| Level | Role | Examples |
| --- | --- | --- |
| 1 Primitives | Design system | Button, Input, Select, Badge, Dialog, Card, Avatar, Table |
| 2 Layout | Structure | PageContainer, Section, Stack, Grid, Sidebar, Drawer |
| 3 Domain | Business meaning | ProfessionalCard, ProfileCompletionCard, VerificationBadge, BusinessCard |
| 4 Workflow | Actions | VerificationReviewPanel, PublishDialog, DecisionActions |
| 5 Pages | Route compositions | ProfessionalsPage → filters + table + actions |

Interactive primitives: default, hover, active, disabled, loading, error.

---

## 1.8.5 Design tokens (direction)

Establish in **Phase 5** before feature polish: type scale, colour (primary, surface, success, warning, danger, text), spacing scale, radius, limited shadows.

Do not invent a parallel design system besides Tailwind + shadcn tokens.

---

## 1.8.6 State boundaries

| Kind | Examples | Direction |
| --- | --- | --- |
| Server | Profiles, queues, publications | Fetch/cache from Supabase or server actions. **OPEN:** TanStack Query vs RSC + revalidate |
| Client UI | Drawer open, modal, ephemeral filters before URL sync | Local state; URL is source for EXCO filters (1.5) |
| Form | Editor, register | React Hook Form + Zod (**locked** in Phase 0) |

Do not store the same professional name in React state **and** a global store **and** query cache as three sources of truth.

---

## 1.8.7 Data access

```text
Component → hook → service/module → Supabase client or Route Handler → Postgres (RLS)
```

Avoid `fetch` inside presentational cards.

**Do not lock** a public REST surface such as `/api/dashboardData`. Dashboards compose domain reads.

If Route Handlers exist later, they should follow **entities/actions**, not screens. Prefer RLS + server components where they fit the starter (Phase 4).

---

## 1.8.8 Forms

Schema → form state → validation → submit → inline success/error.

`ProfileEditor` sections are **components**, not routes: Identity, Professional, Skills, Experience, Business, Links, Visibility (plus Opportunities overlap with MEM-04).

`RegistrationForm` stays Stage 1 only.

---

## 1.8.9 Lists / EXCO workspaces

```text
Workspace → Search → Filters (URL) → DataTable → row actions → pagination
```

Loading, empty (first-use vs filtered), error required.

---

## 1.8.10 Workflow components

**Verification:** Queue → ReviewPanel on **record** → DecisionActions → ConfirmationModal → toast/result → navigate per 1.5/1.6 (queue on completed decision).

**Publication:** status display, publish/unpublish, confirmation, preview to public projection.

**Save:** edit → save → inline confirmation → stay.

**Confirm:** delete/publish/reject/suspend (when those actions exist).

---

## 1.8.11 Permission-aware UI

```text
<PermissionGate permission="professional.verify">…</PermissionGate>
can("business.manage")
```

Three layers: route gate, component visibility, **backend/RLS**. Frontend is not authoritative.

Avoid scattering `if (role === "EXCO")`.

---

## 1.8.12 Reliability UI

- Skeletons for major data views  
- Action pending copy (“Saving…”)  
- Shared `EmptyState` (icon, title, description, action)  
- `ErrorBoundary` + feature error copy in human language  
- Toasts for save/verify/publish; **not** a V1 notification centre  

---

## 1.8.13 Build order (maps to Phase 0 — do not execute in Phase 1)

| When | Work |
| --- | --- |
| **Phase 4** | Starter, strip demos, routing shells, Supabase project, Auth foundation, env, CI |
| **Phase 5** | Tokens, primitives, shells visual language |
| **Phases 6–7** | Register, passwordless access |
| **Phases 8–9** | Profile, conditional business/job-seeker |
| **Phases 10–13** | EXCO, directory, verification, privacy |
| **Later** | Spotlight, migration, QA |

Do **not** start “Phase A foundation” until Phase 2 schema and Phase 3 security contracts exist, unless the product owner **explicitly amends** the Phase 0 roadmap.

---

## 1.8.14 Open (Phase 4)

TanStack Query, Zustand, REST vs server actions, exact `src/` names, toast library (if not shadcn).

---

## PHASE 1.8 STATUS: PASS / LOCKED (construction contract)

**Implementation is not authorised by this document.**
