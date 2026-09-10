# RLS architecture (design)

**Status:** Designed. SQL in `supabase/policies/` is **not applied**. No Postgres.

Identity: `auth.uid()` = `public.users.id`. Role via `user_roles` → `roles.name`. Helpers: `app.has_role`, `app.has_permission`, `app.own_profile_id`, `app.associated_business`.

`app.is_exco_viewer()` means Viewer **or higher** (read-tier). It must not appear on INSERT/UPDATE/DELETE policies.

**Default:** ENABLE ROW LEVEL SECURITY; **no** `USING (true)` on sensitive tables.

**Prisma:** privileged `DATABASE_URL` typically **bypasses RLS**. Domain authorization remains mandatory. Dual-client wiring is **Phase 4**, not this phase.

Anonymous: `app.directory_professionals()` SECURITY DEFINER (`search_path = public, pg_temp`), explicit columns, filter DIRECTORY+VERIFIED. GRANT EXECUTE of that function to `anon` only — not other `app.*` helpers. Do not grant `anon` SELECT on `profiles`.

SECURITY DEFINER: no dynamic SQL; owner should be a privileged migration role; functions read `auth.uid()` of the **invoker**.

---

## Per-table policy intent

| Table | Anon | Member | Viewer | Admin | Super | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| users | No | Own row | **No** | Ops | Ops | **NO POLICY** | Own limited; Super status | **NO POLICY** |
| profiles | Directory fn only | Own; MEMBERS_ONLY+VERIFIED | Operational SELECT | All ops | All | Own 1:1 | Own content; triggers | Soft |
| professional_details | No | Own | SELECT | SELECT/UPDATE | ✓ | Own | Own / Admin | Own |
| experiences | No | Own | SELECT | SELECT | ✓ | Own | Own | Own |
| skills, services, industries | No | Read active | Read | Read | Write | Super | Super | Super |
| profile_skills / profile_services | No | Own | SELECT | SELECT | ✓ | Own | — | Own |
| businesses | No | Associated | APPROVED SELECT | All | ✓ | Active¹ | Content vs status | Soft |
| business_professionals | No | Associated | SELECT | ✓ | ✓ | Own/Ad | **NO POLICY** | Own/Ad |
| opportunities | No | Own | Non-draft SELECT | All | ✓ | Own | Own / Ad | Own/Ad |
| church_information | **No** | Own | **No** | Need-based | ✓ | Own | Own | Own |
| documents | **No** | Own | **No** | `document.review` | ✓ | Own | Meta / review | **NO POLICY** |
| consents | No | Own | No | Authorized | ✓ | Grant | Withdraw only | **No** |
| verification_records | No | No | **No** | ✓ | ✓ | Admin | **NO POLICY** | **No** |
| publications | No | No | **No** | ✓ | ✓ | Admin | **NO POLICY** | **No** |
| admin_notes | No | No | **No** | ✓ | ✓ | Admin | Admin | Admin |
| spotlights | No | PUBLISHED SELECT | PUBLISHED SELECT | ✓ | ✓ | manage | manage | Archive |
| notifications | No | Own | No | No | No | System | `read_at` | System |
| audit_logs | No | No | No | `audit.view` | ✓ | System | **No** | **No** |
| roles | No | Assigned names | Assigned names | Assigned names | ✓ | Super | Super | Super |
| permissions | No | No | No | No | ✓ | Super | Super | Super |
| user_roles | No | Own rows | Own rows | Own rows | ✓ | Super | Super | Super |
| role_permissions | No | No | No | No | ✓ | Super | Super | Super |

¹ Orphan-business INSERT is a **Phase 4 domain-transaction** requirement (business + `business_professionals` together).

Member UPDATE: cannot set `verification_status`; cannot set or leave DIRECTORY except via Admin commands. Viewer: no church, documents, notes, verification rows, or `users` email dump.

Service-role exceptions: Auth trigger insert `users`; audit insert; signed URL mint — server-side, authorized first, audited.

Privileged column SQL: `20-privileged-columns.sql`.
