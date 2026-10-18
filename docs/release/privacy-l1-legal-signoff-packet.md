# PRIVACY-L1 — Legal / privacy sign-off packet (Gate 6B)

**Public route:** `https://tncod-professionals-azure.vercel.app/privacy` (HTTP 200 verified)  
**Candidate source:** `docs/legal/privacy-notice-candidate.md`  
**Implementation:** merged Gate 6A (`/privacy` + join / sign-in / footer links)  
**Engineering must not invent statutory conclusions.**

**Owner confirmation 2026-10-18:** legal organization: **Triumphant Nation City of David**;
country: **Nigeria**; someone actively monitors `cityofdavidprofessionals@gmail.com`.
The earlier contact selection is now supplemented by these explicit facts. Do not
ask for them again without contradictory evidence. No registered address, named
case handler, response-time commitment or approval of the full notice was supplied.
The legal sign-off below remains pending.

The candidate's “Who we are” section includes the owner-confirmed operator,
country and monitored inbox. Matching public copy is now implemented in
[PR #26](https://github.com/OlaNailedIT/tncod-professionals/pull/26), head
`2ffae6413702bb30105eff58f33d9a329fd37903`: **OPEN / NOT RELEASED**. Four focused
tests passed (0 failed/skipped), typecheck/lint passed, and exact-head CI verify
(including build) and Vercel Preview checks passed. Two fact tests failed against
the original page before the fix. These are isolated notice-render tests, not
browser/physical-device acceptance or full legal sign-off. No runtime policy,
database, Auth, environment, dependency or Production change.

Current Production `/privacy` still has the previous paragraph until separately
released; it already links the inbox. Narrow wording represented by this change:

> TNCOD Professionals is operated by Triumphant Nation City of David, Nigeria, for professionals and related community participants. For privacy questions, contact cityofdavidprofessionals@gmail.com. This inbox is actively monitored.

Keep the existing mailto link and product behavior. No new consent checkbox,
compliance claim, retention period, address, statutory conclusion or policy change.

---

## Public text currently deployed

Factual notice covering:

- what TNCOD Professionals is  
- registration ≠ verification ≠ publication ≠ visibility preference  
- categories collected (account, profile, visibility prefs, business docs, opportunities interest, Auth/session/ops logs)  
- why data is used  
- who can see what (member / EXCO / directory projection / hosts)  
- visibility preferences ≠ legal consent; no generic consent engine  
- session cookies for signed-in operation  
- contact: `cityofdavidprofessionals@gmail.com`

No consent checkbox / no consent DB flag was added.

---

## Factual product statements (already accurate)

These may remain as written unless legal requires different wording:

- Product controls for directory visibility preferences  
- Controlled directory projection only for verified + published professionals  
- Private treatment of contact/community fields under current product rules  
- Opportunity interest = connection signal only  

---

## LEGAL / PRIVACY ITEMS REQUIRING CONFIRMATION

| Item | Current state in public text |
| --- | --- |
| Operator identity and country | Owner confirmed Triumphant Nation City of David, Nigeria; candidate updated, public copy not yet changed |
| Registered/postal address and final controller wording | Not supplied or independently verified; no particulars invented |
| Applicable legal bases | Not asserted |
| Retention schedules | Not asserted with fixed periods |
| International / data-transfer wording | Hosting regions mentioned only generically in candidate doc; public page soft |
| Cookie / tracking disclosure table | Session cookies noted only |
| Change-notification wording | Not asserted |

Owner/legal must reply with exactly one of:

```text
LEGAL SIGN-OFF: APPROVED AS WRITTEN
```

or:

```text
LEGAL SIGN-OFF: APPROVED WITH CHANGES
```

followed by the **exact** replacement wording for each changed section.

or:

```text
LEGAL SIGN-OFF: NOT APPROVED
```

Until then:

```text
PRIVACY-L1: PENDING
```
