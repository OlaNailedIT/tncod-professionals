# User roles

**Status:** Locked for V1 role set (Phase 0)  
**Permissions detail:** Field-level and RLS design is Phase 3  
**Auth implementation:** Phases 7 and 10

---

## Initial role model

| Role | Typical actor |
| --- | --- |
| **Member** | Community participant with a professional record |
| **EXCO Viewer** | Operational read access to permitted directory/search |
| **EXCO Admin** | Operational administration, verification, visibility |
| **Super Admin** | EXCO user management, roles, system configuration |

These four roles are locked for V1. Additional roles must not be invented during implementation.

---

## Member

**Can:**

- Create / register their own professional record
- Access their own profile (after passwordless access is established)
- Edit their own profile
- Submit information
- Upload permitted documents
- Manage permitted visibility and consent settings

**Cannot:**

- Access other members’ private information
- Access EXCO notes
- Verify profiles
- Access administration

---

## EXCO Viewer

**Can:**

- Search permitted professional records
- View permitted profiles
- Use directory / search functionality

**Cannot:**

- Verify records
- Modify sensitive information
- Modify system configuration

---

## EXCO Admin

**Can:**

- Review profiles
- Review documents
- Verify appropriate claims
- Manage directory visibility
- Manage professional records (operational administration)
- Manage business verification
- Manage administrative notes
- Perform operational directory administration

**Cannot (reserved for Super Admin unless a later spec says otherwise):**

- Manage EXCO users
- Manage roles
- Manage system-level configuration

**OPEN DECISION (Phase 3):** Exact split between “manage professional records” for EXCO Admin vs irreversible/destructive actions (merge duplicates, hard delete). Default: prefer reversible operational actions for EXCO Admin.

---

## Super Admin

**Can:**

- Manage EXCO users
- Manage roles
- Manage system-level configuration
- Access system administration and audit controls

Super Admin is not a substitute for day-to-day EXCO Admin work; it is the control plane for who may operate the system.

---

## Cross-cutting rules

- A person may be a Member and also hold an EXCO role. **OPEN DECISION (Phase 3):** whether that is one identity with multiple roles or separate staff accounts.
- EXCO access is never implied by membership alone.
- Members never see other members’ documents, verification evidence, or admin notes.
- Public directory visitors (unauthenticated) are **not** a V1 role with account capabilities; they may only see approved public directory fields if/when a public surface is enabled.

**OPEN DECISION (Phase 1 / 13):** Whether V1 ships a public directory page at launch or members-only directory first, still using the hybrid *model*.
