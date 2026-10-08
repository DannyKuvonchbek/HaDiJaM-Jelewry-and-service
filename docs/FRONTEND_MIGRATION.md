# Next.js frontend migration plan

> Snapshot: 2026-10-07 (Asia/Seoul). Requested migration: Nestar → Petoria. Evidence: current repository, working-tree diff against `36b7a4c`, and visible conversation. The repository actually identifies itself as **Hadijam**, a jewelry marketplace; no Nestar/Petoria identifiers or Next.js frontend were found in `src`. Earlier migration conversations are unavailable. Observed implementation, proposed migration work, and unknown history are distinguished below. No database migration or deployment is evidenced.

## Scope and current state

No Next.js frontend source or package is present in this workspace. No frontend refactor is verified. The old Nestar feature names below are **conditional conceptual mappings**, not discovered file paths or confirmed old APIs. Petoria pet terminology is provisional until scope is confirmed.

## Step-by-step sequence

1. Obtain the actual frontend workspace; inventory App Router versus Pages Router, route paths, layouts, navigation, Apollo client configuration, generated types, GraphQL documents, auth storage, uploads, environment variables, and cache policies.
2. Confirm Petoria catalog and service scope. Decide whether product listings, pet listings, adoption and suite reservations are distinct domains. Confirm provider roles, target locale, currency, and time zone.
3. Generate/export the backend schema in an isolated development environment. Diff it against old frontend documents and identify invalid root fields, arguments, enum values, scalar serialization, non-null selections, and fragments.
4. Introduce a central terminology and route map. Update branding, metadata, logos, SEO, translations, navigation, empty states, emails/copy, and accessibility labels. Avoid blanket identifier replacement.
5. Migrate authentication/profile/provider directory first using actual Member APIs. Preserve `USER`/`SELLER`/`ADMIN` wire values unless backend contracts change.
6. Migrate catalog list/detail/search and create/update forms with `Product` inputs and pagination. Remove jewelry filters only in coordination with the schema; implement pet attributes only after backend support exists.
7. Migrate service directory/details/provider dashboard using `Service` APIs. Add booking screens using the real booking DTOs; replace hardcoded jewelry resources only with confirmed server rules.
8. Integrate orders, service requests, deliveries, reviews, community, favorites and follows. Render viewer flags from arrays, and invalidate/refetch affected lists and counters after mutations.
9. Handle routes/redirects and old links intentionally. Update Apollo normalized cache policies when type names change; regenerate types and remove obsolete documents only after callers migrate.
10. Validate all documents against the exported schema, run frontend typecheck/build and end-to-end flows, then stage a coordinated release with data migration and rollback where required.

## Conditional page/component mappings

- Old Nestar home/search → Petoria home/catalog entry; replace property marketing with approved product/service content.
- Old property listing/search → product catalog/search **if the target entity is merchandise**; create a distinct pet/adoption page only if supported by new backend models.
- Old property detail/card/filter → product detail/card/filter; use actual `productTitle`, `productPrice`, `productImages`, `productDesc`, `productType` fields. Remove assumed housing attributes; do not rename bedrooms into pet attributes.
- Old agent directory/profile → seller/provider directory/profile, currently backed by `getSellers`/`getMember`; UI labels can differ from stored `SELLER`.
- Old agent property-management/create/edit → seller product management/create/edit using `getSellerProducts`, `createProduct`, `updateProduct`.
- Old favorites/recently viewed → saved products/recently viewed using `getFavorites`/`getVisitedProducts`.
- Old account/profile → account/profile; retain auth and member identity contract.
- Old community board/article/comments → Petoria community/article/comments; retain BoardArticle and Comment APIs provisionally.
- Old administrative property/member screens → product/service/member administration; enforce existing backend admin guards.
- New service directory/detail → service cards and provider service pages; no old counterpart is assumed.
- New appointment dashboard → customer/provider booking lists and status actions.
- New orders/requests/deliveries/reviews → dedicated target workflows; map an old page only after inventory.
- Current salon suite UI, if present in a separate client → retain, redesign, or remove after product decision; a suite reservation is not proven equivalent to grooming.

Exact filenames, URLs, and component symbols remain TBD until the frontend is inspected.

## GraphQL query/mutation rename plan

These old names are hypotheses to search for, not confirmed Nestar contracts:

- `getProperties` → `getProducts(input)`; `getProperty` → `getProduct(productId)`.
- `createProperty` → `createProduct(input)`; `updateProperty` → `updateProduct(input)`.
- `likeTargetProperty` → `likeTargetProduct(productId)`.
- `getAgentProperties` → `getSellerProducts(input)`; `getAgents` → `getSellers(input)`.
- `getAllPropertiesByAdmin` → `getAllProductsByAdmin(input)`; `updatePropertyByAdmin` → `updateProductByAdmin(input)`; `removePropertyByAdmin` → `removeProductByAdmin(productId)`.
- Favorites/history: target `getFavorites(input)` and `getVisitedProducts(input)`; old root names unknown.

For every confirmed mapping, migrate operation label, root field, variables, input types, selections, fragment type conditions, hooks, mocks, cache updates, and role restrictions together. Do not assume a `propertyId` argument or any old input shape exists without checking.

Current target service/workflow roots:

- Services: `getServices`, `getService`, `getProviderServices`, `createService`, `updateService`, `likeTargetService`, `getAllServicesByAdmin`, `updateServiceByAdmin`.
- Bookings: `createServiceBooking(input)`, `getUnavailableServiceBookingSlots(input)`, `updateServiceBooking(input)`, `getMyServiceBookings(input)`; these require authentication.
- Schedules: `createServiceSchedule`, `updateServiceSchedule`, `removeServiceSchedule`, `getServiceSchedules`.
- Requests: `createServiceRequest`, `updateServiceRequest`, `getMyServiceRequests`.
- Deliveries: `createServiceDelivery`, `updateServiceDelivery`, `getMyServiceDeliveries`.
- Reviews: `createServiceReview`, `updateServiceReview`, `getServiceReviews(serviceId, input)`.
- Orders: `createOrder`, `updateOrder`, `updateOrderItem`, `getMyOrders`, `getSellerOrders`, `getAllOrdersByAdmin`, `updateOrderByAdmin`.
- Salon: `getMySalonReservations`, `getBookedSalonTimes(suiteId, from, to)`, `createSalonReservation(input)`, `deletePastSalonReservation(reservationId)`, `rescheduleMySalonReservation(input)`, `cancelMySalonReservation(reservationId)`.
- Follows: `subscribe(input: String)`/`unsubscribe(input: String)` return `Follower`; `getMemberFollowings(input)`/`getMemberFollowers(input)` return envelopes with `list` and `metaCounter`.

Keep `signup`, `login`, `getMember`, `updateMember`, community roots, and upload roots unless an actual schema diff requires changes. GraphQL operation document names may change independently of backend root fields; no Nestar compatibility aliases are implemented here.

## UI terminology changes

- Nestar and current Hadijam branding → Petoria, after confirming assets and product identity.
- Property/properties → product/products for merchandise; pet/pets only for a dedicated supported entity.
- Agent → seller/service provider according to screen context; do not invent an `AGENT` → `PROVIDER` enum migration.
- Property favorites → saved products; service likes remain service-specific.
- Jewelry repair/polishing, atelier, gold/gem/certification filters, selected jewelry items → approved pet-care/catalog language and structured fields; replacements are pending product rules.
- Salon suite, guest, item manifest, valet → review individually; do not automatically relabel them as pet, owner, or grooming fields.
- Preserve technical statuses in requests; localize their display labels separately.

## Acceptance criteria

All operations validate against the reviewed schema; anonymous/authenticated/admin flows work; empty metadata arrays render safely; forms match server validation; availability handles races and date/time boundaries; upload handling works on supported clients; old routes have intentional redirects; no stale Nestar/Hadijam copy remains except documented historical references. No criterion is marked passed in this snapshot.
