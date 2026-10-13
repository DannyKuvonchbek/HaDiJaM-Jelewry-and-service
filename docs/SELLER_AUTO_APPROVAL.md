# Seller automatic activation — 2026-10-13

This replaces mandatory documents and manual approval as the default signup policy.

- Business name/address remain required. ID/business document inputs remain visible and usable, but neither file is required.
- Each supplied document is still validated for format/size and account ownership. One document is permitted; two supplied documents must be distinct. Documents remain private.
- Submission creates a PENDING application and the existing under-review notification. The member remains USER during the delay.
- `autoApproveAt` is persisted for five seconds after submission. A backend worker checks due applications every 500 ms and atomically approves the application, changes the same active USER to SELLER, writes one existing success notification and one SMS queue job, and records a SYSTEM audit.
- The five-second interval is an activation delay, not actual human document verification. Existing English notification wording is preserved as requested.
- The worker survives page closure through database persistence. On restart it resumes due applications. Existing pending applications without `autoApproveAt` receive a five-second deadline when the module starts.
- Duplicate submissions/worker attempts do not create another decision notification or role change. Rejected applications are not approved until resubmitted; blocked/deleted applicants are not approved.
- Admin management endpoints remain guarded; ADMIN cannot be created through signup. Manual review remains available and races safely with automatic approval.
- MyPage polls quickly while a seller applicant is USER, refreshes the member role, and reloads Messages on activation. No fresh login is required.
- Real SMS settings have not changed. Tests use disabled SMS or a fake gateway.

## Changed files

Backend: governance DTO/schema/service. Frontend: signup, SellerApplicationPanel, MyPage and admin SellerApplications.

## Validation

Backend build, frontend typecheck/build, and disposable replica-set GraphQL/HTTP tests passed. Tests cover optional documents, foreign-document rejection, a five-second minimum delay, restart recovery, same-session seller privileges, and one success notification/SMS job/SYSTEM audit; existing approval/rejection/private-document/SMS regressions also pass.

Deploy backend and frontend together. These changes have not been deployed to the production server in this session.
