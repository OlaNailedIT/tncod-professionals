# Product principles

**Status:** Locked (Phase 0)  
**Use:** Non-negotiable constraints for UX, data, security, and implementation phases

---

## Principles

1. **Everyone can join.** Anyone connected to the TNCOD community who wants to participate professionally may register. “Professional” is not a narrow eligibility gate.

2. **Registration before enrichment.** Capture a useful record first. Do not block record creation on a complete profile.

3. **Progressive disclosure.** Ask for more only when it is relevant. Stage 1 stays short; Stage 2 is optional-until-completed enrichment.

4. **Structured data where useful.** Prefer fields EXCO can search, filter, and act on over unstructured biography-only capture.

5. **Collection does not equal verification.** A typed claim is not a verified credential. Verification is an EXCO-backed state.

6. **Verification does not equal publication.** A verified designation does not automatically publish a profile. Directory visibility is a separate control.

7. **Privacy by design.** Collection ≠ publication. Distinguish what is stored, what the member sees, what EXCO sees, what authenticated members see, and what the public directory may show.

8. **Low-friction member registration.** No passwords at registration. Authentication must not be the barrier to joining the network.

9. **Member experience is mobile-first.** Registration and profile completion must work well on a phone.

10. **EXCO experience is operationally efficient.** Search, queues, verification, and directory administration should be usable without technical expertise.

11. **Build the smallest useful system.** V1 is bounded. Prefer the smallest design that satisfies locked scope.

12. **Do not introduce future features prematurely.** Roadmap items (chat, AI, payments, messaging, etc.) stay out of V1 design and code.

13. **Important state changes must be auditable.** Verification, visibility, and similar operational actions need a history that EXCO can understand.

14. **The database should support connection, not merely storage.** Data exists so TNCOD can responsibly identify needs and offerings — not as an archive for its own sake.

15. **EXCO should be able to use the system without technical expertise.** Operational language, not developer language, in EXCO UI (when UI is designed).

---

## Derived architectural rules

| Rule | Consequence |
| --- | --- |
| Independent states | Profile status, verification status, and directory visibility stay separate |
| Record-first | Registration creates a professional record immediately |
| Secure access later | Passwordless auth; no long-term secret URL as the security model |
| Hybrid directory | Public / members / private layers; publication is controlled |
| Conditional profiles | Shared core profile + situational sections |
| Starter is scaffolding | Technical starter must not become the product architecture |

---

## What agents must not do

- Invent eligibility tests that exclude legitimate community participants.
- Show verified ticks on self-asserted titles.
- Publish records because they exist in the database.
- Add Stage 1 fields from Stage 2 without an approved spec change.
- Collapse lifecycle into a single status because it is simpler to code.
