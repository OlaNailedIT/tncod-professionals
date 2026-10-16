# Production migration — interest roster SELECT policy

**Status:** prepared for owner approval. **Do not apply** until the owner authorizes this file by name.  
**File, and only this file:** `supabase/migrations/20261016120000_opportunity_interest_roster_select.sql`  
**Target, when authorized:** TNCOD Professionals Production, project `brpppukzqgpzxjelwwrj`  
**Not authorized:** `supabase db push`, a full migration replay, or any other pending file

## Prerequisites

1. PR #21 is reviewed and the owner gives a fresh authorization that names this file.
2. The operator confirms the database host is the Production project above, not the local port `54322`.
3. No other migration is applied in the same step.

## Apply

Use the Database Gate mechanism: one `psql -v ON_ERROR_STOP=1` session. Do not use `supabase db push`.

Run the session from the repository root so `\i` reads the reviewed file unchanged. The session is one transaction. It aborts unless `opportunity_interests_select` is still the expected expression `(app.owns_profile(profile_id) OR app.is_exco_viewer())`. That is the expression `pg_get_expr` returns for the policy this file replaces.

The history write is the same insert Phase 12 closeout uses. `supabase_migrations.schema_migrations` has required `version` and nullable `statements` and `name`. Insert only `20261016120000`, in the same transaction as the policy change.

```sql
BEGIN;

DO $$
DECLARE
  expr text;
BEGIN
  SELECT pg_get_expr(p.polqual, p.polrelid)
    INTO expr
  FROM pg_policy p
  WHERE p.polrelid = 'public.opportunity_interests'::regclass
    AND p.polname = 'opportunity_interests_select';

  IF expr IS DISTINCT FROM '(app.owns_profile(profile_id) OR app.is_exco_viewer())' THEN
    RAISE EXCEPTION
      'refusing 20261016120000: opportunity_interests_select is %',
      COALESCE(expr, '<missing>');
  END IF;
END $$;

\i supabase/migrations/20261016120000_opportunity_interest_roster_select.sql

INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('20261016120000')
ON CONFLICT DO NOTHING;

COMMIT;
```

If the verification raises, or either statement in the reviewed file fails, `ON_ERROR_STOP` rolls the transaction back. No other version is marked applied.

## Read-back

```sql
SELECT pg_get_expr(polqual, polrelid)
FROM pg_policy
WHERE polrelid = 'public.opportunity_interests'::regclass
  AND polname = 'opportunity_interests_select';

SELECT version
FROM supabase_migrations.schema_migrations
WHERE version = '20261016120000';
```

The policy expression must be `(app.owns_profile(profile_id) OR app.is_exco_admin())`. The history query must return `20261016120000`.

## Expected effect

- A member session can still read that member’s own `opportunity_interests` row.
- An anonymous session cannot read interest rows.
- An EXCO_VIEWER session cannot read another member’s interest row.
- An EXCO_ADMIN or SUPER_ADMIN session can read interest rows for follow-up.
- Express and withdraw stay the existing own-row insert and delete policies. This file does not change them.
- Application code that uses the privileged database connection still depends on the server loader. The policy change is the direct-session control.

## Release order

1. Owner authorization names `20261016120000_opportunity_interest_roster_select.sql` and project `brpppukzqgpzxjelwwrj`.
2. Apply the single transaction above. Do not merge on the strength of this document alone.
3. Read the policy and the history row back.
4. Merge PR #21 and deploy that application commit. The loader is the application control; the policy is the direct-session control.
5. If that application release must be undone, roll back the application deployment only.

## Recovery

The default recovery is an application rollback. Leave the tighter SELECT policy in place. Leave the `20261016120000` row in `supabase_migrations.schema_migrations`.

Do not restore `is_exco_viewer()` access to other members’ interests. Do not delete the history row. Either reversal is a separate reviewed recovery decision that names this policy and this version. It is not part of this release.
