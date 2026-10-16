# Production migration — interest roster SELECT policy

**Status:** prepared for a later explicit approval. **Do not apply** under the current review instruction.  
**File, and only this file:** `supabase/migrations/20261016120000_opportunity_interest_roster_select.sql`  
**Target, when authorized:** TNCOD Professionals Production, project `brpppukzqgpzxjelwwrj`  
**Not authorized:** `supabase db push`, a full migration replay, or any other pending file

## Prerequisites

1. PR #21 is reviewed and the owner gives a fresh authorization that names this file.
2. The operator confirms the database host is the Production project above, not the local port `54322`.
3. A read of the current policy shows `opportunity_interests_select` still uses `app.owns_profile(profile_id) OR app.is_exco_viewer()`.
4. No other migration is applied in the same step.

## Apply

Run only the statements in `20261016120000_opportunity_interest_roster_select.sql` against that Production database.

If the operator records migration history by hand, insert version `20261016120000` only after the policy statement succeeds. Do not mark any other version applied.

## Expected effect

- A member session can still read that member’s own `opportunity_interests` row.
- An anonymous session cannot read interest rows.
- An EXCO_VIEWER session cannot read another member’s interest row.
- An EXCO_ADMIN or SUPER_ADMIN session can read interest rows for follow-up.
- Express and withdraw stay the existing own-row insert and delete policies. This file does not change them.
- Application code that uses the privileged database connection still depends on the server loader. The policy change is the direct-session control.

## Recovery

If the new policy must be undone, replace it with the previous expression and remove only the `20261016120000` history row if one was inserted:

```sql
DROP POLICY IF EXISTS opportunity_interests_select ON public.opportunity_interests;

CREATE POLICY opportunity_interests_select ON public.opportunity_interests
  FOR SELECT TO authenticated
  USING (
    app.owns_profile(profile_id)
    OR app.is_exco_viewer()
  );

DELETE FROM supabase_migrations.schema_migrations
WHERE version = '20261016120000';
```

Then read the policy expression back and confirm it matches the previous `is_exco_viewer()` form. Do not drop the table and do not re-run earlier migrations.
