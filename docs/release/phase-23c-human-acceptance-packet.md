# Phase 23C — Human device acceptance packet

**Status:** **READY / not executed**  
**Automation cannot close 23C.** Use a real phone and a tablet/iPad-class device.

**Production origin:** `https://tncod-professionals-azure.vercel.app`  
**Do not** treat desktop browser emulation as PASS.

---

## Devices

| Device | OS / browser | Tester | Date |
| --- | --- | --- | --- |
| Phone | | | |
| Tablet / iPad-class | | | |

---

## Tasks (launch-critical)

For each row: mark PASS/FAIL, severity (S0–S3), optional screenshot path.

| # | Task | Expected outcome | Phone | Tablet | Severity if FAIL | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Open home `/` | Brand/home readable; Join + Sign in reachable; no horizontal overflow | | | | |
| 2 | Open public nav / menu | Home, Professionals, Join, Sign in work | | | | |
| 3 | `/join` | Form usable; fields and submit reachable without clipped controls | | | | |
| 4 | `/sign-in` | Email + OTP entry usable; keyboard does not hide primary actions | | | | |
| 5 | After sign-in → `/dashboard` | Member shell usable; primary next action clear | | | | |
| 6 | `/profile` and `/profile/edit` | Overview + edit usable; save path clear | | | | |
| 7 | `/settings/privacy` | Visibility controls understandable; save works | | | | |
| 8 | `/businesses` (if member has/creates) | List/create/edit reachable without dead ends | | | | |
| 9 | `/opportunities` | List + detail usable; interest action clear | | | | |
| 10 | `/professionals` + one profile | Directory list + detail readable | | | | |
| 11 | EXCO surfaces (authorised tester only) | `/exco`, analytics, professionals, verification reachable; no linked 404 stubs | | | | |
| 12 | `/privacy` | Notice readable on small screens | | | | |
| 13 | `/design-system` | Production returns **404** (not a product surface) | | | | |

---

## Result rule

```text
23C: HUMAN EVIDENCE REQUIRED
```

until both phone and tablet rows are completed by a human with PASS/FAIL filled.
