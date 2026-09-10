# Product scope — V1

**Status:** Locked (Phase 0)  
**Applies to:** TNCOD Professionals V1  
**Does not apply to:** Phases 19–20 and any feature listed under Non-goals

---

## V1 boundary (locked)

V1 is the smallest useful system that:

1. Lets community members create a professional record quickly.
2. Lets members complete and manage a progressive profile under secure access.
3. Gives EXCO an operational view of the professional database, verification, and controlled directory publication.

V1 is **not** a social network, CRM, payments platform, or AI matching product.

---

## Member — in scope for V1

### Registration

- Landing page
- Quick registration (target ~30–60 seconds)
- Professional record creation
- Registration confirmation

### Access

- Passwordless secure profile access (implemented in Phase 7, specified here as V1 scope)

### Profile

- Profile completion (progressive)
- Profile editing
- Professional information
- Skills
- Services
- Opportunities / needs
- Contribution / offering
- Location
- Community information
- Conditional business information
- Conditional employment / job-seeker information

### Privacy

- Directory visibility preferences
- Consent management (as designed in Phase 13)

---

## EXCO — in scope for V1

### Access

- Secure authentication for EXCO roles

### Dashboard

- Overview
- New registrations
- Profile completion
- Verification queue
- Businesses
- Job seekers
- Directory statistics

### Directory management

- Search
- Filters
- Professional profiles
- Business profiles
- Profile status (the independent dimensions — not a single collapsed status)
- Visibility management

### Verification

- Review profile
- Review documents
- Verify
- Request clarification
- Reject
- Verification history

### Administration

- Admin notes
- Export
- Basic reporting
- Role-based access (Member / EXCO Viewer / EXCO Admin / Super Admin)

---

## Quick registration fields (Stage 1)

Collect only:

1. Full name
2. Phone / WhatsApp number
3. Email
4. Current professional status
5. Profession / primary area of expertise
6. Company, organisation or business (optional)
7. What the member is looking for
8. What the member can offer

**Do not add to initial registration** unless a later approved specification changes this:

- Gender
- Birthday
- CAC documents
- Professional photo
- Biography
- LinkedIn
- Extensive work history
- Unnecessary church information
- Credentials

---

## Profile enrichment (Stage 2) — in scope, progressive

The member may later complete:

- Preferred name
- Professional headshot
- Location
- Industry
- Professional experience
- Skills
- Services
- LinkedIn
- Professional bio
- Church / service information
- Mentorship availability
- Training / speaking
- Volunteering
- Referrals
- Collaboration
- Opportunity preferences
- Conditional business information
- Conditional employment / job-seeker information

A member remains useful to the internal database if Stage 2 is incomplete.

---

## Conditional profile principle (in scope)

Do not force every member through every section. Adapt sections to situation. Reuse shared structures; do not create a separate product per category.

Illustrative (UX detail in Phase 1; data model in Phase 2):

| Situation | Additional emphasis |
| --- | --- |
| Business owner | Business information; business verification where applicable |
| Seeking employment | Experience, skills, employment and opportunity preferences |
| Student / intern | Early-career information, skills, learning interests, opportunities |
| Freelancer / consultant | Services, client/service information, collaboration/referral preferences |
| Retired professional | Background, mentorship, advisory/service opportunities |

---

## Business information (V1, conditional)

Business owners may eventually provide:

- Business name, category, description, location
- Business phone, business email, website, social links
- CAC registration status, CAC registration number, CAC certificate
- Company profile, relevant credentials

Submitted business information is **not** automatically verified.

Conceptual business verification states:

- `not_submitted`
- `pending`
- `under_review`
- `verified`
- `needs_clarification`
- `rejected`

**OPEN DECISION (later phase):** Detailed TNCOD verification policy, evidence rules, and which claims require which documents.

---

## V1 non-goals (explicit exclusions)

Do **not** design or implement as V1:

- Chat
- Social feed
- Public reviews
- Ratings
- Payments
- Subscriptions
- Native mobile app
- AI matching
- AI chatbot
- Automated WhatsApp messaging
- Event management
- Full CRM
- Complex / advanced notification engine
- Member-to-member messaging
- Advanced / sophisticated recommendation engine

These may appear on the long-term roadmap (Phases 19–20 and beyond). They must not leak into current specifications as implied requirements.

---

## Explicitly deferred (not non-goals, but not this phase)

| Area | Phase |
| --- | --- |
| Screen inventory, routes, copy, IA | 1 |
| Database schema | 2 |
| RLS / field-level permissions | 3 |
| Repo/starter, Supabase project, CI | 4 |
| Design system | 5 |
| Feature implementation | 6–15 |
| Spotlight product design | 15 |
| Historical data migration | (later / deferred) |
| QA / Killcritic | (later) |
| Pilot and production | (later) |

---

## Scope change rule

New capabilities require explicit product approval and a documentation update **before** implementation. Cursor agents must not expand V1 because a feature seems useful.
