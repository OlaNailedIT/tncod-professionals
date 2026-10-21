# Phase 23C — Human device acceptance packet

**Status:** **PARTIAL / remaining human evidence required** (reconciled 2026-10-18)
**Automation cannot close 23C.** Use a real phone and a tablet/iPad-class device.

**Production origin:** `https://tncod-professionals-azure.vercel.app`  
**Do not** treat desktop browser emulation as PASS.  
**Do not** invent devices, screenshots, or results.

## Evidence already supplied — do not restart it

The owner reported phone/tablet navigation, join, email sign-in/dashboard, profile
overview, edit/save and privacy/save passing. These are human owner reports, not
emulated test results. Carry them forward in rows 2–7 and 9 below. Device/browser
models and exact observation dates were not recorded; do not invent them or make
missing model metadata a reason to rerun passing rows. Other criteria remain open.
The later desktop Member↔EXCO result is separately verified in the Stage B/C
records; it does not fill the remaining physical-device EXCO row.

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
| 2 | Open public menu / nav | Home, Professionals, Join, Sign in work | PASS — owner report | PASS — owner report | | Models/date unrecorded |
| 3 | `/join` — register | Form usable; required fields clear; submit reachable; no clipped buttons | PASS — owner report | PASS — owner report | | Carry forward; no new registration required |
| 4 | `/sign-in` — email OTP | Enter email → receive code → enter OTP; keyboard does not hide primary actions | PASS — owner report | PASS — owner report | | Do not request another code just for this row |
| 5 | After sign-in → `/dashboard` | Member home usable; next step is clear | PASS — owner report | PASS — owner report | | Independent participant comprehension remains 23D |
| 6 | `/profile` overview | Status language readable (completion / verification / directory stay distinct) | PASS — owner report | PASS — owner report | | Do not infer participant understanding from this |
| 7 | `/profile/edit` | Edit + save works; required vs optional clear enough to finish | PASS — owner report | PASS — owner report | | Carry forward |
| 8 | Verification presentation | You can tell verification is a separate step from joining (no false “already verified” claim) | | | | |
| 9 | `/settings/privacy` | Visibility controls understandable; save works | PASS — owner report | PASS — owner report | | Legal sign-off remains separate |
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
