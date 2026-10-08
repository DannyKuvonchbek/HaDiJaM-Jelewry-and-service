# Next steps

> Snapshot: 2026-10-07 (Asia/Seoul). Requested migration: Nestar → Petoria. Evidence: current repository, working-tree diff against `36b7a4c`, and visible conversation. The repository actually identifies itself as **Hadijam**, a jewelry marketplace; no Nestar/Petoria identifiers or Next.js frontend were found in `src`. Earlier migration conversations are unavailable. Observed implementation, proposed migration work, and unknown history are distinguished below. No database migration or deployment is evidenced.

Tomorrow means **2026-10-08, Asia/Seoul**. This is a prioritized work plan, not a scheduled automation. P0 decisions precede dependent implementation.

## Backend cleanup

1. **P0 — Resolve migration identity/scope.** Confirm actual Nestar origin and Petoria product definition; reconcile the Hadijam repository mismatch. Acceptance: explicit source/target domain and keep/remove decisions for jewelry/suites.
2. **P0 — Establish contract baseline.** Review working diff and untracked feature files, bootstrap in an isolated dev environment, export schema and verify module/model injection. Acceptance: reproducible baseline and schema artifact.
3. **P0 — Audit existing booking documents/indexes.** Identify missing required fields, duplicate references/slot keys, and affected non-null API fields. Design idempotent backfill, index rollout, backup and rollback; do not run against production without the appropriate deployment scope.
4. **P1 — Fix salon booking races.** Replace check-then-write-only protection with atomic active-slot uniqueness; cover create/reschedule/cancel. Acceptance: concurrent attempts produce one active reservation per configured resource slot.
5. **P1 — Replace confirmed legacy domain rules.** Move jewelry classification, technician/item options, prices and schedules into approved Petoria models/configuration; settle resource scope and time zones. Do not invent pet fields from generic property replacements.
6. **P1 — Review relationship consistency and duplicate files.** Check follow/like races and counter reconciliation; inspect duplicate-looking TypeScript files before removal. Acceptance: defined behavior under retries and failures.
7. **P2 — Branding/operational cleanup.** Update approved names and future reference prefixes with historical compatibility; review CORS, upload formats and deployment defaults.

## Frontend migration

1. **P0 — Locate frontend and inventory real routes/components/documents.** Replace conceptual mappings in FRONTEND_MIGRATION.md with exact paths.
2. **P1 — Migrate auth/profile and catalog.** Generate types from schema; update operation roots/variables/selections, cache policies, labels, routes and provider roles together.
3. **P1 — Migrate services/appointments.** Implement availability, confirmed pricing, status actions and explicit time-zone handling; decide salon retention first.
4. **P2 — Migrate orders, requests, deliveries, reviews, community and social state.** Reconcile shared counters and cached lists after mutations.
5. **P2 — Finish redirects, accessibility, localization, metadata and stale-brand audit.** Acceptance: supported flows contain approved Petoria vocabulary and old links behave intentionally.

## Testing

1. **P0 — Run dependency-supported backend build/typecheck and isolated schema startup.** Record commands/results; no test script is currently declared.
2. **P1 — Validate auth/ownership/role boundaries.** Include anonymous access, provider/customer status changes, admin operations and cross-user salon changes.
3. **P1 — Test appointment races and lifecycle.** Duplicate create, concurrent reschedule, cancellation/rejection release, unsupported transitions, future-time enforcement, date/time mismatch and Seoul midnight boundaries.
4. **P1 — Test migration compatibility.** Old documents lacking new fields, duplicate index values, reference lookup, backfill idempotency and rollback.
5. **P2 — Test catalog/social/upload flows.** Anonymous and authenticated lists, empty metadata arrays, repeated likes/follows, counter consistency, pagination and HEIC/HEIF acceptance/rendering.
6. **P2 — Validate frontend schema compatibility, build and end-to-end customer/provider/admin journeys.** Record concrete pass/fail results before release.

## Documentation

1. **P0 — Record confirmed scope and decisions.** Add explicit rationale and replace unknown-history claims only with evidence.
2. **P1 — Add actual frontend path and GraphQL schema-diff inventory.** Include exact breaking changes and compatibility windows.
3. **P1 — Document backfill/index rollout and rollback runbook.** State environments, preconditions, verification and historical ID/reference policy.
4. **P2 — Refresh completed tasks and validation evidence.** Link commits/PRs and test outputs, distinguish implemented from planned, and update reusable prompts.
