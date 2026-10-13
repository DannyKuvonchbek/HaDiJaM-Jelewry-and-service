# Private atelier chat — 2026-10-13

Chat owner lookup and MyPage inbox now use the active SELLER named Martin instead of Danny. No member was renamed, created or granted a role by this change. The configured database could not be reached to verify that production Martin is ACTIVE/SELLER.

Chat sends are available 24/7. The gateway business-hour rejection and frontend closed/disabled-time state were removed. Session authentication, participant privacy, revocation checks and document access remain enforced. Appointment/salon schedules are unaffected.

Backend/frontend builds and frontend typecheck passed. Gateway tests verify Martin ownership, Saturday/Sunday/night sends and revoked-session rejection. Tests use mocked transport/services and do not send production messages.

Deploy both repositories. Production requires Martin's existing account to be an ACTIVE SELLER. Existing chat history is not deleted or migrated; customer conversations remain keyed by atelier/customer.
