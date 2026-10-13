# Phase 23C — Human device acceptance packet

**Status:** **READY / not executed**  
**Automation cannot close 23C.** Use a real phone and a tablet/iPad-class device.

**Production origin:** `https://tncod-professionals-azure.vercel.app`  
**Do not** treat desktop browser emulation as PASS.  
**Do not** invent devices, screenshots, or results.

---

## How to run this (non-technical)

1. Open this checklist on a laptop (for notes) while you test on the **phone**, then repeat on the **tablet**.  
2. On the device, open Safari/Chrome and go to the Production origin above.  
3. For each row in the task table: do the task, then write **PASS** or **FAIL** in the Phone or Tablet column.  
4. If **FAIL**: add severity (below), one short sentence of what went wrong, and optionally save a screenshot to a folder you control (do not commit private screenshots into git).  
5. When both devices are done, send the filled table to the project owner.

### Severity (only when FAIL)

| Code | Meaning |
| --- | --- |
| S0 | Cannot complete a launch-critical path (join, sign-in, or core navigation broken) |
| S1 | Major usability block on a required surface |
| S2 | Confusing or hard to use, but a workaround exists |
| S3 | Minor polish / cosmetic |

### Screenshot tip

Name files like `23c-phone-task-04-otp.png`. Capture the whole screen including any error message.

---

## Devices

| Device | OS / browser | Tester name | Date |
| --- | --- | --- | --- |
| Phone | | | |
| Tablet / iPad-class | | | |

---

## Tasks (launch-critical)

For each row: mark PASS/FAIL, severity (S0–S3) if FAIL, optional screenshot path.

| # | Task | Expected outcome | Phone | Tablet | Severity if FAIL | Notes / screenshot |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Open home `/` | Brand/home readable; Join + Sign in reachable; no sideways scrolling | | | | |
| 2 | Open public menu / nav | Home, Professionals, Join, Sign in work | | | | |
| 3 | `/join` — register | Form usable; required fields clear; submit reachable; no clipped buttons | | | | |
| 4 | `/sign-in` — email OTP | Enter email → receive code → enter OTP; keyboard does not hide primary actions | | | | |
| 5 | After sign-in → `/dashboard` | Member home usable; next step is clear | | | | |
| 6 | `/profile` overview | Status language readable (completion / verification / directory stay distinct) | | | | |
| 7 | `/profile/edit` | Edit + save works; required vs optional clear enough to finish | | | | |
| 8 | Verification presentation | You can tell verification is a separate step from joining (no false “already verified” claim) | | | | |
| 9 | `/settings/privacy` | Visibility controls understandable; save works | | | | |
| 10 | Directory eligibility | On `/professionals`, only published+verified people appear publicly; your unpublished record is not wrongly public | | | | |
| 11 | `/professionals` + one profile | List + detail readable on small screens | | | | |
| 12 | `/businesses` (if applicable) | List/create/edit reachable without dead ends | | | | |
| 13 | `/opportunities` | List + detail usable; “express interest” meaning is clear | | | | |
| 14 | EXCO surfaces (authorised tester only) | `/exco`, analytics, professionals, verification reachable; no linked 404 stubs | | | | |
| 15 | Accessibility / errors | Focusable controls work; failed actions show a clear message (no silent fail) | | | | |
| 16 | `/privacy` | Privacy Notice readable on small screens | | | | |
| 17 | `/design-system` | Production returns **404** (not a product page) | | | | |

---

## Overall result (fill at end)

```text
23C PHONE:   PASS | FAIL | INCOMPLETE
23C TABLET:  PASS | FAIL | INCOMPLETE
Tester:
Date:
Corrective actions required (if any):
```

Until both phone and tablet rows are completed by a human:

```text
23C: HUMAN EVIDENCE REQUIRED
```
