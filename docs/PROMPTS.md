# Session prompts and reusable prompts

> Snapshot: 2026-10-07 (Asia/Seoul). Requested migration: Nestar → Petoria. Evidence: current repository, working-tree diff against `36b7a4c`, and visible conversation. The repository actually identifies itself as **Hadijam**, a jewelry marketplace; no Nestar/Petoria identifiers or Next.js frontend were found in `src`. Earlier migration conversations are unavailable. Observed implementation, proposed migration work, and unknown history are distinguished below. No database migration or deployment is evidenced.

## Useful visible-session prompts

### Documentation handoff request (condensed, not verbatim)

> Create docs/BACKEND_MIGRATION.md, DECISIONS.md, FRONTEND_MIGRATION.md, COMPLETED_TASKS.md, NEXT_STEPS.md and PROMPTS.md summarizing the Nestar → Petoria migration. Cover backend architecture/names/modules/GraphQL/MongoDB/compatibility, decisions with rationale/risks/alternatives, a step-by-step Next.js migration plan, completed refactors and validation, prioritized next tasks, and reusable prompts. Do not change application source; create documentation only. Be precise and technical.

### Earlier request (translated summary)

> Where is Codex Plan mode, and how do I enable it?

That earlier exchange provides no application migration evidence. No other past migration prompts can be recovered from the visible conversation; the prompts below are newly generated templates.

## Next-session handoff

```text
Read all six docs/*.md migration handoff files and applicable repository instructions. Reinspect git status, current diff, README, package metadata, modules, resolvers and schemas. The requested target is Nestar → Petoria, but the inspected backend identifies as Hadijam jewelry. Distinguish verified code, inferred rationale, proposed work and unavailable history. Confirm target scope before dependent domain redesign. Preserve existing user changes and never claim unrun checks passed. Begin with a concise current-state summary and highest-priority unresolved dependency.
```

## Read-only migration inventory

```text
Perform a read-only inventory of the actual Nestar source and Petoria target repositories available in this workspace. Identify exact module, schema, collection, enum, GraphQL root/input/output and frontend route/component differences. Cite file paths. Do not assume conceptual property/product or agent/provider mappings are already implemented. List missing evidence and actual breaking changes. Do not edit source or access production data.
```

## Backend implementation after scope confirmation

```text
Read docs/BACKEND_MIGRATION.md, docs/DECISIONS.md and docs/NEXT_STEPS.md. Implement the highest-priority backend task that is supported by confirmed product decisions. Preserve unrelated working changes. Keep neutral existing contracts unless a documented requirement needs a breaking change. Update DTOs, resolver guards, service logic, schemas and client compatibility notes together. Run appropriate available validation and report exact results, remaining risks and changed files. Update completed tasks after verification.
```

## Booking correctness

```text
Audit service-bookings and salon-reservations for concurrent create/reschedule/cancel, uniqueness, ownership, state transitions, date/time consistency and resource scope. Inspect deployed-index assumptions without reading secrets. Propose then implement a focused fix within the authorized development scope, preserving historical records. Use meaningful concurrency/lifecycle tests in an isolated database and document required backfill/index rollout separately. Do not claim application-level exists checks provide atomic uniqueness.
```

## Next.js frontend migration

```text
Read docs/FRONTEND_MIGRATION.md and inspect the actual frontend repository before editing. Replace conceptual mappings with exact old/new routes and component paths. Validate all GraphQL documents against a generated backend schema. Migrate one coherent flow at a time, including operation labels, root fields, arguments, inputs, selections, fragments, generated types, hooks, cache updates, authorization and UI wording. Do not invent pet/adoption fields unsupported by the backend. Run available typecheck/build and relevant end-to-end checks; record outcomes.
```

## Data migration design

```text
Design an idempotent MongoDB migration for the confirmed schema changes. Inventory required-field gaps, duplicates, index creation constraints, ObjectId references, old booking reference preservation and GraphQL non-null compatibility. Provide dry-run counts, deterministic transformation rules, backup/rollback plan and post-migration verification. Do not execute production mutations. Do not rename collections merely to match UI branding.
```

## Documentation refresh only

```text
Update only the six migration files under docs/. Inspect current diff and validation evidence. Record implemented changes with paths and verified test results; retain explicit unknowns and distinguish proposed tasks from accepted decisions. Reconcile the Nestar/Petoria/Hadijam naming mismatch only with new evidence. Preserve source/config/dependencies and do not run write-mode formatters. Refresh tomorrow's priorities using the user's Asia/Seoul date.
```

## Focused validation

```text
Validate the current backend without source changes: inspect available scripts, run the appropriate build/typecheck if dependencies are present, and report exact commands/results. Use an isolated development environment for GraphQL startup and MongoDB integration checks. Check required DTO/schema compatibility, booking indexes/concurrency, social metadata arrays and authorization boundaries. Do not install dependencies, change generated artifacts or access production data unless that work is authorized.
```
