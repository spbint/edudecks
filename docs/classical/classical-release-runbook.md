# MyLearna Classical release runbook

The version-controlled Classical Curriculum Registry is the authoring authority. `public.marketplace_resources` is a persisted catalogue projection used by Resource Cupboard references; it is not a curriculum source.

## Release states

- `planned` may contain approved curriculum metadata and booklet assets, but is excluded from customer Pathways, application Marketplace listings, and live booklet lookup.
- `live` is customer-visible through those adapters and therefore requires a matching active catalogue row to exist first.

NEVER flip a new Encounter to `live` before its required catalogue row is production-ready.

## Release sequence

1. Add the complete Encounter to the canonical registry with `releaseState: "planned"`.
2. Add and verify the approved booklet assets while it remains planned.
3. Generate deterministic catalogue SQL without applying it:

   `npm run classical:catalogue:sql -- --code MYL-CLASSICAL-...`

   To write an explicitly chosen review file, add `--out <path>`. The command never chooses a migration filename and never connects to Supabase.
4. Review the generated upsert as a forward migration. It may write only the matching `public.marketplace_resources` projection.
5. Apply the reviewed catalogue migration before changing the application release state. An early active row is not listed by product UI: Marketplace discovery comes from live registry entries, and Cupboard has no database-driven catalogue browser. The authenticated database policy can expose active rows to direct API clients, so catalogue metadata must be considered publishable at this point.
6. Verify the production row read-only: `source`, `external_product_id`, `handle`, `title`, cover, format, `is_active`, and critical metadata must match `checkClassicalCatalogueReleaseReadiness(...)`.
7. Change only the approved Encounter's `releaseState` from `planned` to `live` plus any explicitly approved release-only changes.
8. Deploy the application. Pathways, booklet resolution, Marketplace, and Cupboard save then activate against the already-published row.
9. Smoke-check Pathways identity, booklet delivery, Marketplace detail, and idempotent Save to Cupboard.

## Rollback

- If catalogue publication fails, do not flip the Encounter live.
- If the application release fails after catalogue publication, revert the application release-state change. The harmless catalogue row may remain.
- Never destructively delete family-owned Resource Cupboard references as an automatic rollback.
