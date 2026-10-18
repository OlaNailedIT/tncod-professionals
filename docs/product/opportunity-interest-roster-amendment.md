# Amendment — opportunity interest roster

**Recorded:** 2026-10-16, before implementation  
**Authorizing instruction:** project owner, narrow launch-scope addition  
**Amends:** Phase 16 lock line “no interest lists/counts in UI” (`docs/product/phase-16-opportunities-scope.md`)  
**Does not reopen:** messaging, notifications, exports, applications, recruitment states, automated introductions, matching rules, Auth, or directory publication

## Why

Authorized EXCO operators need to see which members currently expressed interest in an opportunity so they can follow up themselves. The product already stores `opportunity_interests` and already has `/opportunities/[id]` and `/exco/professionals/[id]`. It did not show the current interest list.

## Allowed

- On the existing opportunity detail page, EXCO_ADMIN and SUPER_ADMIN see a section titled **Expressed interest**.
- Each row shows the member display name, the interest timestamp, and a link to the existing EXCO professional detail route.
- The loader checks the actor’s server roles. EXCO_ADMIN and SUPER_ADMIN pass. MEMBER, anonymous, and EXCO_VIEWER do not, including when the loader is called directly.
- Withdrawn interest is the deleted row. It is not shown as current interest.
- A closed opportunity may still list interest that was recorded while it was open. New interest remains denied by the existing command.
- No interests, a missing opportunity, and a deleted or inactive profile are empty or not found. They do not fall through to another opportunity.
- The database SELECT policy is tightened so an EXCO_VIEWER session cannot read other members’ interest rows. Members can still read their own row. This migration is in the review branch. It is not applied to Production by this change.

## Still forbidden

Contact fields on the roster payload. The existing professional detail page remains the contact-review surface, under its existing EXCO access check.

A potential match is not expressed interest. The deterministic match panel stays separate and keeps its own heading.

No in-product message, notification, export, application, recruitment state, or introduction.

## Production

This amendment is implementation authorization for a review pull request. It is not authorization to merge or to deploy.
