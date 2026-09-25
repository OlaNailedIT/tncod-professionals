-- Phase 21 — Close PostgREST dual-path around public directory projection.
--
-- App directory reads use Prisma + Phase 14 preference withhold
-- (`applyVisibilityPreferencesToPublicProfessional`). The SQL view/function
-- remained GRANT SELECT/EXECUTE to anon+authenticated and returned allowlist
-- columns WITHOUT preference withhold — a privacy bypass via PostgREST/RPC.
--
-- Function + view remain for schema documentation / future use; public API access
-- is revoked. Phase 13 product routes are unchanged (Next.js projection).

REVOKE SELECT ON public.directory_professionals FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION app.directory_professionals() FROM anon, authenticated;

COMMENT ON FUNCTION app.directory_professionals() IS
  'Phase 13 directory projection (VERIFIED∧DIRECTORY∧slug). Phase 21: EXECUTE revoked from anon/authenticated; Next.js Prisma path enforces Phase 14 preference withhold.';

COMMENT ON VIEW public.directory_professionals IS
  'Phase 13 projection view. Phase 21: SELECT revoked from anon/authenticated; not a PostgREST public API.';
