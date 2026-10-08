# Completed tasks and observed refactors

> Snapshot: 2026-10-07 (Asia/Seoul). Requested migration: Nestar → Petoria. Evidence: current repository, working-tree diff against `36b7a4c`, and visible conversation. The repository actually identifies itself as **Hadijam**, a jewelry marketplace; no Nestar/Petoria identifiers or Next.js frontend were found in `src`. Earlier migration conversations are unavailable. Observed implementation, proposed migration work, and unknown history are distinguished below. No database migration or deployment is evidenced.

## Completed in this visible documentation request

- Inspected README, package, module registration, resolvers, DTOs, schemas, relevant services, and working-tree diff.
- Created the six requested migration handoff documents under `docs/`.
- Distinguished implemented Hadijam behavior from proposed Nestar → Petoria work.
- Did not modify application source code, configuration, dependencies, or database records.

The earlier visible conversation only explains Codex Plan mode. It contains no completed backend/frontend migration implementation. The source changes below predate this documentation work; their author, completion date, and relationship to unavailable session history cannot be established.

## Observed existing working-tree refactors

- **Follow relationships:** member service integration, ObjectId validation/conversion, shared member lookups, viewer-specific likes/follows, enriched Follower/Following DTOs and resolver signatures.
- **Likes:** ObjectId-based filters, typed `MeLiked[]` responses and favorites pagination result; products/services return refreshed viewer favorite metadata after toggles.
- **Catalog:** optional viewer identity in product/service lists; product text search covers title/description and adds jewelry-specific metal/gemstone/certification filters.
- **Service bookings:** active-service lookup, server-owned provider/price/reference/status, jewelry resource/item validation, Seoul-local slot validation, unavailable-slot query, customer contact/item/payment fields, unique partial booking indexes, and release of slot keys on cancellation/rejection.
- **Salon reservations:** new module/service/resolver/DTO/schema files; customer list, availability, create, delete past/cancelled, reschedule and cancel operations. Files are currently untracked, not committed.
- **Uploads/bootstrap:** HEIC/HEIF MIME entries and bootstrap changes; current runtime configuration is recorded in BACKEND_MIGRATION.md.

### Tracked files changed relative to local HEAD

- `src/components/components.module.ts`
- `src/components/follows/follow.resolver.ts`
- `src/components/follows/follow.service.ts`
- `src/components/follows/follows.module.ts`
- `src/components/likes/like.service.ts`
- `src/components/products/product.resolver.ts`
- `src/components/products/product.service.ts`
- `src/components/service-bookings/service-booking.resolver.ts`
- `src/components/service-bookings/service-booking.service.ts`
- `src/components/service-bookings/service-bookings.module.ts`
- `src/components/services/service.resolver.ts`
- `src/components/services/service.service.ts`
- `src/libs/config.ts`
- `src/libs/dto/follow/follow.input.ts`
- `src/libs/dto/follow/follow.ts`
- `src/libs/dto/like/like.input.ts`
- `src/libs/dto/like/like.ts`
- `src/libs/dto/product/product.input.ts`
- `src/libs/dto/service-booking/service-booking.input.ts`
- `src/libs/dto/service-booking/service-booking.ts`
- `src/main.ts`
- `src/schemas/ServiceBooking.model.ts`

### Untracked implementation and duplicate-file observations

- `src/components/salon-reservations/`
- `src/libs/dto/salon-reservation/`
- `src/schemas/SalonReservation.model.ts`
- `src/components/follows/follow.service 2.ts` is untracked duplicate-looking code.
- `src/libs/dto/order/order 2.ts` and `order.input 2.ts` also exist. Their intent and compilation effects require review; no deletion was performed.

## Existing baseline capabilities, not proven session changes

Members/auth, products, services, orders/items, service schedules/requests/deliveries/reviews, likes/views/follows, comments/boards, database integration and sockets already exist. No Petoria-specific pet/adoption schema or Nestar rename history is established.

## Validation status

- Repository/static inspection: completed.
- Documentation creation and source-preservation check: completed; hashes of pre-existing non-document files were compared after writing.
- Build/typecheck: not run; no previous passing result is available.
- Runtime dependency injection/GraphQL schema generation: not run.
- MongoDB indexes, backfill, transaction/race behavior and data compatibility: not tested.
- Frontend typecheck/build/end-to-end: not run; frontend absent.
- Automated tests: no test script or project test/spec files were found in the inspected inventory; test infrastructure needs confirmation.
- Production deployment/data migration: not performed or verified.

A present code path is not evidence of successful execution. In particular, new required booking fields, salon concurrency and counter consistency remain open validation items.
