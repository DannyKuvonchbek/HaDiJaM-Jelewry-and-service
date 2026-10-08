# Backend migration: Nestar → Petoria

> Snapshot: 2026-10-07 (Asia/Seoul). Requested migration: Nestar → Petoria. Evidence: current repository, working-tree diff against `36b7a4c`, and visible conversation. The repository actually identifies itself as **Hadijam**, a jewelry marketplace; no Nestar/Petoria identifiers or Next.js frontend were found in `src`. Earlier migration conversations are unavailable. Observed implementation, proposed migration work, and unknown history are distinguished below. No database migration or deployment is evidenced.

## Original project summary

The user names Nestar as the migration origin. Its original repository, schema, routes, and implementation are not available here; a real-estate origin must not be treated as verified. The only local commit is `36b7a4c` (`BBR: MY FIRST HADIJAM PROJECT`). It already contains products, services, bookings, orders, members, and social features. It cannot establish a Nestar-to-Petoria refactor history.

## New project summary and goal

Petoria is the requested target name. A pet marketplace/service interpretation is a **planning assumption**, requiring confirmation of catalog, provider roles, appointment rules, and any pet/adoption features. Current implementation is NestJS 10, Apollo Server 4, code-first GraphQL, Mongoose 8, JWT authentication, uploads, and WebSockets. `package.json` remains `hadijam-backend`; README describes jewelry.

Goal: reuse the implemented platform capabilities while replacing confirmed legacy domain rules and branding, aligning the Next.js client with the actual schema, and explicitly migrating stored data where necessary. This goal is not yet verified as complete.

## Naming changes

- Nestar → Petoria: requested branding direction; no implemented rename is evidenced.
- Hadijam/HaDiJaM → Petoria: required cleanup candidate in README, package metadata, labels, booking references, and search constants. Existing references use `HDJ-SVC-` and `HDJ-SAL-`; preserve historical reference lookup when introducing a new prefix.
- `Product`, `Service`, `Member`: current neutral domain names; retain provisionally until target requirements settle.
- `SELLER`: current member enum, alongside `USER` and `ADMIN`; provider wording in UI does not automatically change this API value.
- Repair/polishing, jewelry item types, technician names, metals, gemstones, certification labels, salon suites/amenities: current jewelry-specific semantics; proposed pet replacements are not implemented.

## Module changes and current registration

`src/components/components.module.ts` imports members, products, services, orders, service bookings, salon reservations, service schedules, service requests, service deliveries, service reviews, likes, views, follows, comments, board articles, and auth.

Observed working-tree changes:

- Added `SalonReservationsModule` registration and untracked `src/components/salon-reservations/` implementation.
- `ServiceBookingsModule` registers both `ServiceBooking` and `Service` models and imports auth.
- Follows module/service/resolver changed to use member service and enriched relationship responses.
- Products/services resolvers pass optional authenticated member identity into listing services.
- Deliveries, requests, schedules, reviews, orders, and other registered modules exist in the baseline; they are not demonstrated to be new session refactors.

No `PetsModule`, adoption module, or veterinary-specific module is present. Creating one is a product decision, not a completed rename.

## GraphQL changes

Schema is generated in memory (`autoSchemaFile: true`) in `src/app.module.ts`. `/graphql` is the documented endpoint. Playground and introspection are disabled in production. Validate a generated schema before publishing frontend operations.

Observed changes and contracts:

- Added authenticated query `getUnavailableServiceBookingSlots(input: ServiceBookingAvailabilityInput): [String]` for unavailable Seoul-local time labels.
- Booking operations remain `createServiceBooking`, `updateServiceBooking`, `getMyServiceBookings`; DTOs expose additional appointment/reference/customer/item/payment fields.
- Salon queries: authenticated `getMySalonReservations`; public `getBookedSalonTimes(suiteId, from, to)`.
- Salon mutations: `createSalonReservation(input)`, `deletePastSalonReservation(reservationId)`, `rescheduleMySalonReservation(input)`, `cancelMySalonReservation(reservationId)`, all authenticated.
- Follow mutations now declare `Follower` results; follower/following list DTOs include nullable `meLiked` and `meFollowed` arrays and joined member data.
- Product search adds `metals`, `gemstone`, `certifications`; these are jewelry-specific filters.
- Product/service lists and like mutations supply viewer-specific favorite data. `meLiked` is an array of `{ memberId, likeRefId, myFavorite }`, not a boolean. `meFollowed` is likewise an array.

No compatibility aliases for Nestar root fields are evidenced. See [frontend plan](FRONTEND_MIGRATION.md) for conditional mappings.

## MongoDB collections and schemas

Explicit collection names in `src/schemas`:

- Core: `members`, `products`, `services`, `orders`, `orderItems`.
- Appointments/workflow: `serviceBookings`, `salonReservations`, `serviceSchedules`, `serviceRequests`, `serviceDeliveries`, `serviceReviews`.
- Social/content: `likes`, `views`, `follows`, `comments`, `boardArticles`.
- Additional schema files: `auths`, `notifications`, `boconfigs`, `notices`. A schema file alone does not establish active feature registration.

`ServiceBooking.model.ts` adds service title, booking reference, technician, selected items, item description/photo, payment status, and slot key. Unique partial indexes on string-valued `slotKey` and `bookingReference` allow older documents lacking those values. Required fields still need a compatibility/backfill audit; partial indexes do not backfill data or satisfy GraphQL non-null fields.

`SalonReservation.model.ts` is untracked new code with customer reference, unique reference, requested/confirmed/cancelled status, suite/date/time, guest contact, manifest, amenities, and valet flag. Its `(suiteId, bookingTime, reservationStatus)` index is **not unique**: service-level existence checks do not prevent concurrent duplicate reservations.

Other references use MongoDB ObjectIds, principally `Member`, `Service`, and `ServiceBooking`. Shared likes/follows aggregation helpers convert string identities to ObjectIds.

No collection rename script, data backfill, dry run, production index inspection, or database execution is evidenced. Do not infer a `properties` → `products` database migration from current code.

## Compatibility and operational notes

- Preserve existing IDs and references until a reviewed migration provides deterministic old/new mappings and rollback.
- Changing GraphQL names, enum values, required fields, or collection names requires coordinated client/data changes; UI branding alone does not.
- Service bookings currently classify services from title/category text, hardcode jewelry technicians/items and Asia/Seoul time slots, and compute prices server-side (repair fixed at 45). These rules need redesign for Petoria.
- Cancellation/rejection unsets service booking `slotKey`; concurrency and state transitions need integration tests. The key includes service ID, so cross-service technician contention is not globally prevented.
- Salon reservations and service bookings are separate persistence and API domains; do not silently equate a luxury salon suite with a pet grooming appointment.
- Bootstrap uses global transforming/whitelisting validation, credentialed reflected-origin CORS, upload limits of 25,000,000 bytes/10 files, `/uploads` static serving, and default port 9702. Verify target deployment settings.
- `MONGODB_URI` falls back to `MONGO_URL`; credentials were not inspected.
- HEIC/HEIF are allowed MIME values; browser display/conversion support remains unverified.

## Validation

Documentation inspection only. No build, runtime startup, database access, GraphQL introspection, automated tests, or frontend validation was run for this documentation task. The package exposes build/start/format scripts, but no test or lint script. See [completed work](COMPLETED_TASKS.md) and [next steps](NEXT_STEPS.md).
