# Phase 1.5 — Navigation architecture refinement

**Status:** LOCKED (structurally)  
**Depends on:** `screen-inventory.md` (1.4 LOCKED)  
**Next:** `interaction-workflows.md` (1.6)

1.4 defined **surfaces**. 1.5 defines **movement**: hierarchy, persistent vs contextual nav, breadcrumbs, back, redirects, deep links, roles, query state, mobile, post-action destinations.

This is a **navigation contract**, not sidebar visual design.

---

## 1.5.1 Principles (locked)

1. Navigation follows **user context** (Public / Member / EXCO) — not one mega-nav.  
2. Items exist because of **regular jobs**, not because data objects exist.  
3. **Context determines visibility** — members never see EXCO nav; EXCO does not have to pass through public/member chrome to operate.  
4. **One destination, one canonical route** — `/exco` not `/admin`.  
5. Persistent nav does **not** duplicate editor sections.  
6. **Back must be predictable**; browser history plus intentional fallbacks.

---

## 1.5.2 Three environments

| Context | Nav purpose |
| --- | --- |
| Public | Discover and join |
| Member | Manage identity and participation |
| EXCO | Operate and manage the network |

---

## 1.5.3 Public navigation

**Primary:** Brand/Home `/` · Professionals `/professionals` · Register `/register` · Sign in `/sign-in`

Home is the **logo**, not a required “Home” label.

**Hierarchy:** `/` → `/professionals` → `/professionals/[slug]`

Public profile is **contextual to the directory**. Deep links still work.

**Detail:** Breadcrumb or “← Back to professionals”. Mobile: simpler back.

**Auth boundary:** Sign in / Register → authenticated environment.

**Protected return:** Unauthenticated `/profile/edit` → `/sign-in` → back to `/profile/edit` (`returnTo` or equivalent). Behaviour locked; mechanism OPEN.

**Registration completion (locked):** `/register` → member created → **`/dashboard`**. Dashboard presents next action (complete profile). Do **not** add permanent `/register/success`, `/complete-profile`, `/onboarding` unless later evidence requires them. First-time messaging may be a **G** on dashboard (see 1.4).

**Sign-out:** Session ends → `/` (or other explicit public dest). User must not remain visually in member/EXCO chrome.

---

## 1.5.4 Member navigation

**Primary:** Dashboard `/dashboard` · Profile `/profile` · Opportunities `/opportunities` · Settings `/settings` (settings **below** a divider: work vs configuration).

**Not primary:** `/profile/edit` — entered from Profile and Dashboard (“Complete profile”).

**Profile related:** `/profile` → editor; public preview → **PUB-03** if published (preview, not a second member profile).

**Editor secondary (C):** About, Professional, Skills & services, Experience, Opportunities, Business, Links, Visibility — inside `/profile/edit`, optional `?section=`.

**Account menu:** Identity actions (settings, sign out). Must **not** clone the whole primary nav.

**Active state:** `/profile/edit` keeps **Profile** active.

**After save:** Remain in editor / opportunities / settings. Do not dump to dashboard unless the workflow requires it.

---

## 1.5.5 EXCO navigation

**Primary:** Dashboard `/exco` · Professionals · Businesses · Verification · Directory · Reports · Settings (settings last).

**Suggested grouping (visual later):** Overview (Dashboard) · Manage (Professionals, Businesses) · Workflows (Verification, Directory) · Insights (Reports) · System (Settings).

**One tree for all EXCO roles.** No `/exco-admin` vs `/exco-viewer`. Permissions change **actions**, not destinations. Viewers may still **see** Professionals without Verify/Delete.

**Parent → child:**

```text
/exco/professionals → /exco/professionals/[id]
/exco/businesses    → /exco/businesses/[id]
```

Child inherits **active** parent nav item.

**Verification:** Queue → professional or business **record**. No `/exco/verification/[id]` in V1.

**Verification return (locked, refines 1.3):** After a **completed** decision (verify/reject), **return to the queue** to preserve operational momentum. If the outcome is **needs clarification**, the record may remain open with the new state visible. Do not send EXCO to `/exco` after every action.

**Directory:** Workspace → record and/or **PUB-03** preview. Preview is the **same** public projection, labelled as preview — not a duplicate public profile product. After publish: remain in EXCO context; offer preview; **do not force** public profile.

**Reports:** Terminal workspace. Categories inside the screen, not `/exco/reports/completion` in V1.

**Deep-linked record:** Reconstruct EXCO chrome, parent relationship, identity, and back fallback to parent workspace.

**Filter preservation:** `/exco/professionals?status=pending` → record → Back restores query. Fallback if no origin: parent workspace unfiltered.

**After record save/publication:** Remain on record. **Delete** (if later allowed): parent workspace.

---

## 1.5.6 Unauthorized and session

| Case | Behaviour |
| --- | --- |
| Member → `/exco` | Unauthorized → `/dashboard` |
| EXCO lacking settings | Unauthorized → `/exco` |
| Session expired on protected page | Sign in → return to intended route when safe |

Do not expose underlying data on unauthorized routes.

---

## 1.5.7 Breadcrumbs

Use where hierarchy orients; not on every screen.

- Public detail: Professionals / Name  
- Member editor: Profile / Edit  
- EXCO records: Professionals / Name, Businesses / Name  
- **Not** Home / Dashboard  

---

## 1.5.8 Mobile (same IA)

No mobile-specific routes.

| Context | Pattern |
| --- | --- |
| Public | Header + simple menu: Professionals, Register, Sign in; logo → `/` |
| Member | Header (menu, title, account) + **drawer**: Dashboard, Profile, Opportunities, Settings. (1.3 bottom nav is compatible as an alternative presentation of the **same** four destinations — visual OPEN, destinations locked.) |
| EXCO | Header + **drawer** with the seven operational items + Settings; preserve labels, active state, grouping; not a pixel copy of the sidebar |

---

## 1.5.9 Query ≠ navigation

`/exco/professionals?status=pending` is still Professionals.  
`/professionals?search=accountant` is still the public directory.  
No routes per workflow state, report, or user type.

---

## 1.5.10 Browser back vs application back

- **Browser back:** history.  
- **Application back:** contextual parent + preserved filters when practical.

---

## 1.5.11 Shells (structure only)

**Public:** top bar (logo, Professionals, Register, Sign in) + content.

**Member:** sidebar or equivalent primary list + header/account + content.

**EXCO:** labelled EXCO shell + operational sidebar + header/account + content.

Jobs differ; shells differ. Visual treatment OPEN.

---

## 1.5.12 Relationship matrix (authoritative)

| From | Action | Destination |
| --- | --- | --- |
| Home | Explore | `/professionals` |
| Home | Join | `/register` |
| Home | Sign in | `/sign-in` |
| Directory | Select | `/professionals/[slug]` |
| Public profile | Back | `/professionals` (+ query if practical) |
| Register | Complete | `/dashboard` |
| Sign in | Authenticate | `/dashboard` or `returnTo`; EXCO → `/exco` |
| Dashboard | View profile | `/profile` |
| Dashboard | Complete profile | `/profile/edit` |
| Dashboard | Opportunities | `/opportunities` |
| Profile | Edit | `/profile/edit` |
| Profile | Public preview | PUB-03 if available |
| Profile editor | Save | Remain editor |
| Opportunities / Settings | Save | Remain |
| EXCO dashboard | Workspaces | matching `/exco/...` |
| Professionals / Businesses list | Select | `[id]` record |
| Verification | Select | EXCO-03 or EXCO-05 |
| Directory | Select / preview | Record / PUB-03 |
| Record | Back | Parent workspace + filters |
| Record | Completed verify/reject | Verification queue |
| Record | Publish | Remain; offer preview |
| Reports | Change report | Same route |

---

## 1.5.13 Anti-patterns (rejected)

`/admin`; `/mobile/...`; `/exco-mobile`; `/profile/skills` etc.; `/exco/verification/pending`; `/exco/reports/completion`; `/job-seekers`; `/business-owners`; duplicate `/member/public-profile`.

---

## 1.5.14 Privacy

Navigation must never present Public / Member / EXCO as tabs on the **same** data environment. They are different trust contexts.

Public nav never exposes EXCO. Member nav never exposes EXCO. Unpublished records are not discoverable via public nav.

---

## 1.5.15 Open (do not block architecture)

Sidebar/drawer visuals; breadcrumb component; `returnTo` implementation; query names; editor section persistence mechanism; exact EXCO action matrix; badges; copy/labels; whether member mobile uses bottom nav vs drawer **presentation**.

---

## PHASE 1.5 STATUS: PASS / LOCKED (navigation contract)

No UI implementation.
