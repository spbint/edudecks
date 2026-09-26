# MyLearna Resource Factory v1

## Objective

Turn MyLearna worksheet production into an unattended production pipeline. The founder should review exceptions and winners, not hand-author every resource.

Initial scope is deliberately narrow:

- Mathematics only.
- Worksheet + answer key.
- Independent QA pass.
- Deterministic MyLearna PDF rendering.
- Publish into the controlled MyLearna Marketplace with `source = mylearna_agent`.
- Start as `free_testing` resources so Pinterest and Marketplace engagement can identify winners before pricing.

## Production flow

```text
coverage planner
  -> generation seed
  -> worksheet generator
  -> independent QA
  -> deterministic PDF renderer
  -> storage
  -> marketplace_resources
  -> Pinterest promotion
  -> engagement metrics
  -> founder reviews winners / exceptions
```

## Important boundary

The Resource Factory must not write into the canonical Classical Curriculum registry.

Classical curriculum remains version-controlled and intentionally released. Autonomous worksheets use a separate Marketplace lane:

```text
marketplace_resources.source = "mylearna_agent"
```

This allows fast production without giving an agent authority over canonical curriculum content.

## QA policy

Velocity is the goal, not perfection.

- Critical issue: block.
- Low factual or answer confidence: retry generation/repair.
- Minor wording/layout issue: publish if scores pass.
- Every published item keeps QA scores and issue count in Marketplace metadata.

The application-side thresholds live in `lib/resourceFactory/qa.ts`.

## Marketplace policy

New agent resources start with:

```text
access_model = free_testing
pricing_state = free_testing
```

Engagement determines what receives founder attention and later pricing/bundling.

## Activation architecture

The intended production infrastructure is:

- Supabase Postgres: durable job/event/artifact state.
- Supabase Queues (`pgmq`): generate, QA, render, publish and promote work.
- Supabase Cron (`pg_cron`): keep the queue filled and invoke workers.
- Server-only workers: OpenAI Responses API generation/QA, PDF rendering, Storage upload, Marketplace projection.
- Pinterest API: create Pins after publish.
- Founder dashboard: show factory state, failures, throughput and winners.

Current Supabase guidance recommends Postgres-native Queues for durable background jobs and Cron for recurring scheduling. Activation must keep queue access server-only.

## Proposed job states

```text
planned
generating
generated
qa
qa_failed
repairing
rendering
ready
published
promoted
failed
```

## v1 production target

Start with 10 resources/day, mathematics only.

Suggested first product families:

- practice
- revision
- skill-check
- challenge

Do not increase throughput until answer accuracy, storage, Marketplace rendering and retry behaviour have been observed in production-like testing.

## Files in this slice

- `lib/resourceFactory/types.ts`
- `lib/resourceFactory/qa.ts`
- `lib/resourceFactory/openai.server.ts`
- `lib/resourceFactory/pdf.ts`
- `lib/resourceFactory/marketplaceProjection.ts`
- `lib/resourceFactory/resourceFactory.test.ts`
- `docs/resource-factory/resource-factory-foundation.sql`

## Activation checklist

1. Review and convert the SQL draft into a real Supabase migration using the repository's normal Supabase migration workflow.
2. Enable `pgmq` and `pg_cron` only through reviewed migration/configuration.
3. Create a private generated-resource Storage bucket/path and service-role-only write path.
4. Add the worker endpoint/function and a secret stored server-side / in Vault.
5. Run one resource end to end with Marketplace `is_active = false`.
6. Verify QA, PDF, metadata and access.
7. Turn on auto-publish for passing maths resources.
8. Add Pinterest promotion only after Marketplace links are stable.
9. Add founder metrics and pricing state transitions.
