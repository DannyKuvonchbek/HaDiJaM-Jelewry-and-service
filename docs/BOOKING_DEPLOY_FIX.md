# Service booking deployment regression — 2026-10-11

## Confirmed defects

- Repair and ultrasonic pages ran their login redirect before cookie session restoration finished. These routes now wait in AuthBootstrap; public pages continue to render normally.
- Repair/cleaning selectors could choose seeded `ATELIER_MILANO_*` services but submit regular staff names and slots. The backend expects Maestro Marco Bellini and 11:00, 14:00 or 17:00. The frontend now derives the staff/slots and price from the selected service category.
- The Assay modal omitted the atelier staff name and interpreted appointment times in the browser timezone. It now sends the category's staff name and explicit Seoul `+09:00` date/time, and offers the allowed slots.
- Availability previously returned occupied bookings only, despite creation also enforcing working hours/breaks. It now includes closed and out-of-schedule atelier slots.
- Multi-piece Milano polishing totals now match the displayed quote and saved booking price.

## Changed locations

Backend: `src/components/service-bookings/service-booking.service.ts`.
Frontend: `libs/auth/AuthBootstrap.tsx`, `libs/utils/serviceBookingRules.ts`, `libs/components/services/booking/ServiceBookingExperience.tsx`, `pages/services/index.tsx`.

## Verification

Backend build, frontend typecheck and isolated production build passed. Disposable MongoDB GraphQL tests passed for salon creation and all six atelier staff/slot contracts, incorrect staff rejection, saved prices, duplicate slot rejection and closed schedules. `scripts/check-booking-ui.cjs` verifies session-restoration gates. No production appointments were created.

## Release

Deploy both repositories together, build both, then restart their existing PM2 applications. Reload the browser after the new frontend build is running. Do not seed/reassign providers or bypass working-day rules to address this regression. Confirm that the production services have their intended `serviceSchedules` entries; a missing schedule correctly prevents atelier booking.

These changes were made locally; production deployment has not been performed by this session.
