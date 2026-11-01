# Profile submission — 1 November 2026

## Report and reproduced failure

The owner reports that an ordinary member could not submit a profile for review: clicking did nothing. Device/browser and the member's exact completion/verification state are unknown. This report is a launch defect, not an enhancement request.

Independent baseline on exact main `b9e133b1bb3f1bd3b3f8db481b57cdb29e2ecfbd`: real local desktop and phone flows signed in using emailed codes, saved 100% profiles and submitted successfully. The same eligible profile with JavaScript unavailable had a permanently disabled submission button. Baseline: **23 assertions passed, 1 failed**. This is a reproduced failure consistent with the symptom; it does not establish the affected person's exact cause.

## Correction

Use the existing authenticated submission command through a progressively enhanced form. The eligible button no longer waits for client hydration. The hydrated flow shows `Submitting…`, prevents duplicate activation and gives accessible errors. A failed connection produces local recovery guidance and a full profile refresh, rather than an unconfirmed success or application-wide error. Expired sessions receive sign-in guidance. Unexpected server failures emit only a fixed event and safe error classification.

The session remains the identity authority. The server still recalculates 100% completion and enforces the existing verification transitions. Submission does not verify or publish a member. No schema, roles, credentials, Auth key controls, datasource, pool normalization or hosting configuration changes.

## Executed evidence

| Check | Result |
| --- | --- |
| Action, status and existing overview tests | 27/27 PASS |
| Changed application/test lint | PASS, zero warnings |
| Optimized Next build, including typecheck | PASS |
| First fixed Playwright journey | 44/44 assertions PASS across five scenarios |
| Extended Playwright journey on the unchanged build | 52/52 assertions PASS across six scenarios |

The extended run finished at `2026-11-01T18:52:10.300Z`. It used the actual optimized application, Chrome, loopback-only database/Auth and the local email catcher. Cases: desktop, 390px phone, JavaScript disabled, blocked profile bundle, failed submission transport plus recovery, and a stale profile rejected by the server. Successful submissions persisted `SUBMITTED:PENDING:PRIVATE`, replaced the button with queue confirmation after reload and produced exactly one audit event. A rejected stale submission produced no success audit. Session shortcuts remained disabled. Synthetic registrations use the existing local test CAPTCHA verifier; this is not real registration-CAPTCHA evidence.

Only new tagged synthetic local fixtures were used and retained. No pre-existing local member, live member, role or data record was changed. Final test code also explicitly counts the blocked bundle request, rather than assuming an interception occurred; its fresh-database setup supplies only an absent MEMBER reference role, leaving existing roles unchanged.

The new path-filtered `Profile review browser journey` CI job starts an ephemeral local Supabase stack and executes this same real application/browser journey. It uses no repository/Production application secrets, project link or hosted database. It suppresses raw CLI credential summaries and retains only synthetic screenshots and redacted assertion results. Its first actual CI outcome must be recorded before release.

## Release closeout

Before release: review the exact PR head; require normal verify and the new browser job; identify the Git-linked Vercel Production SHA after merge; perform bounded deployed read-only checks and inspect relevant runtime errors. The existing deployment at b9e133b remains the rollback candidate and preserves the EXCO pool fix and attribution.

The owner account is already verified and therefore cannot prove an eligible member submission. Do not change that account or another member's state to fabricate a Production test. The affected member's real retry/outcome remains needed to close their report. Their improvement suggestions remain deferred.

Remaining Launch Completion Gates: member acceptance and hosting eligibility/real hosted proof OPEN; completed EXCO, official-host/attribution and 30 October backup evidence carried forward. Public-launch GO remains withheld.

Primary implementation references: [React action state and progressive enhancement](https://react.dev/reference/react/useActionState), [Next forms and server authorization](https://nextjs.org/docs/app/guides/forms), [Supabase CLI setup](https://github.com/supabase/setup-cli), [local stack startup](https://supabase.com/docs/reference/cli/supabase-start).
