# Threat model (Phase 3)

Prioritize P0/P1. Residual risk remains until DB+RLS+tests exist. Invariants: `docs/security/security-architecture.md` §5a.

| Threat | Actor | Surface | Impact | Likelihood | Invariant | Prevention | Detection | Residual | Pri |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Unauthenticated private data | Anon | API/DB | High | Med | SEC-007 | RLS deny; directory fn only | 401/empty | Until applied | P0 |
| IDOR | Member | IDs in URL | High | Med | SEC-001 | Ownership + RLS | 403 tests | UUID ≠ authz | P0 |
| user_id spoofing | Member | Body | High | Med | SEC-002 | Ignore client id | 403 | — | P0 |
| Role spoofing | Anyone | Client state | High | High | SEC-003 | DB roles only | — | P0 if UI-only | P0 |
| MEMBER → EXCO / SUPER_ADMIN | Member | Body/JWT/DB | High | Med | SEC-004, SEC-019 | Super-only `user_roles`; trigger | Denied writes | — | P0 |
| Viewer mutations | EXCO_VIEWER | API/RLS | High | Med | SEC-005, SEC-017 | SELECT-only policies | 403 | — | P0 |
| Admin → role/config | EXCO_ADMIN | API | High | Low | SEC-006 | No `user.manage_roles` | Audit | — | P0 |
| Prisma RLS bypass | App bug | Server | High | High if misused | SEC-016 | Domain authz first | Audit | **P0 Phase 4** | P0 |
| Service-role in browser | Attacker | Bundle | Critical | Low | — | Never NEXT_PUBLIC | Secret scan | Rotate if leaked | P0 |
| Document leakage | Anyone | Storage/API | High | Med | SEC-008, SEC-014 | Private bucket; signed URL | Access logs | Copy in browser | P0 |
| Public/search leakage | Anon | Search/GET | High | Med | SEC-009, SEC-010 | Same filter as GET | Tests | Scraping P2 | P0 |
| Sensitive SELECT * | Dev | API | High | Med | SEC-009, SEC-015 | Projections | Review | P1 | P1 |
| XSS via bio/notes | Member | HTML | Med | Med | — | Plain text | CSP later | P1 | P1 |
| SQL injection | Anyone | Raw SQL | High | Low | — | Prisma / parameterized | — | P1 | P1 |
| CSRF | Browser | Cookies | Med | Stack-dep | — | Phase 4 by transport | — | P1 | P1 |
| Signed URL abuse | Anyone | URL | Med | Med | SEC-014 | Short TTL; authz first | Logs | P1 | P1 |
| Upload abuse | Member | Storage | Med | Med | — | Size/MIME; rate TBD | Rate limit | P1 | P1 |
| Account takeover | Attacker | Auth | High | Med | — | Supabase Auth | Auth logs | P1 | P1 |
| Session abuse | Stolen token | API | High | Med | — | Expiry; suspend | — | P1 | P1 |
| Audit tampering | Member | API | High | Low | SEC-013, SEC-018 | No user DML | — | P1 | P1 |
| Enumeration | Anon | sign-in | Low | Med | — | Generic errors | — | P2 | P2 |
| Directory scraping | Anon | Public fields | Med | Med | SEC-009 | Minimize projection | — | P2 | P2 |
| Excessive EXCO visibility | Viewer | users.email | Med | Low | — | Viewer has no `users` SELECT | Tests | Hardened | P1 |
| Church in directory | Bug | API | Med | Low | SEC-009 | Projection deny | Tests | P1 | P1 |

**Expected:** IDOR DENIED. MEMBER→…→SUPER_ADMIN DENIED. Viewer DELETE DENIED.
