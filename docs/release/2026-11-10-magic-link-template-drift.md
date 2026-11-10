# Magic-link email template drift — release gate

**Observed:** 10 November 2026
**State:** Local source correction proposed; hosted template unchanged

The Phase 23 remediation record says the hosted magic-link email became digits-only. A read-only hosted Auth check on 9 and 10 November instead reported both `{{ .Token }}` and a clickable `{{ .ConfirmationURL }}` anchor. The repository's `supabase/templates/magic_link.html` also contained that anchor. The Phase 20.5 record described the link as optional but acknowledged its scanner-prefetch risk. These records do not establish when the hosted template changed or whether a scanner has consumed any member's link.

Supabase [documents the prefetch risk](https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching): a mail provider can follow a single-use `ConfirmationURL` before the recipient, leaving an invalid link. Supabase recommends an email OTP or a user-controlled confirmation step. The application's sign-in form asks members for the numeric code and verifies it with `verifyOtp`.

This PR updates only the repository template to present `{{ .Token }}` as the sign-in method. It removes the direct confirmation link and wording that tells recipients to use it. It does **not** update the hosted Supabase template, send an OTP, alter an Auth URL, or change the application or Production data.

Before launch approval, an authorized operator should separately review the complete hosted template, approve a bounded code-only template change, save a secure rollback copy, and apply it through the approved release process. Read it back, then use an owner-controlled inbox to confirm that the actual email contains the code and no one-click verification link, and that the code signs in once on the intended official host. Stop if the hosted template differs from the preflight copy, the email is malformed, the code fails, or the change would require a new paid service. Do not include codes, links, addresses, or credentials in the evidence record.

This template gate is separate from the official-domain Site URL and callback change, PR #37's local PKCE change, and the remaining member and recovery gates. No Phase 1 or launch PASS is claimed here.
