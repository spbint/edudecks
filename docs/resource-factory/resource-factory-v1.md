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
  -> Pinterest creative + Pin
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

Agent resources are loaded server-side from `marketplace_resources` so the existing authenticated-only RLS policy does not have to be weakened for public discovery.

Public resource landing pages live at:

```text
/marketplace/worksheets/[handle]
```

## Safe activation switches

The smoke path is deliberately staged by default:

```text
RESOURCE_FACTORY_AUTO_PUBLISH=false
RESOURCE_FACTORY_AUTO_PROMOTE=false
```

With both switches false, a secret-authorised run generates, QA-checks, renders, uploads and creates an inactive Marketplace row.

After staging has been verified:

```text
RESOURCE_FACTORY_AUTO_PUBLISH=true
```

makes passing resources visible in Marketplace.

Only after public resource pages and Pinterest credentials are verified:

```text
RESOURCE_FACTORY_AUTO_PROMOTE=true
```

allows the same run to create a Pinterest Pin.

## Manual end-to-end smoke path

A server-only internal endpoint exists at:

```text
POST /api/internal/resource-factory/run-once
Authorization: Bearer <RESOURCE_FACTORY_RUN_SECRET>
```

Example body:

```json
{
  "yearLevels": ["Year 4"],
  "strand": "Number and place value",
  "skill": "Use place value to read and compare whole numbers",
  "resourceType": "practice",
  "difficulty": "secure",
  "questionCount": 16
}
```

The endpoint:

1. creates a structured worksheet specification;
2. runs independent QA;
3. retries failed QA up to the configured attempt limit;
4. renders worksheet and answer PDFs;
5. uploads the PDFs;
6. upserts a `mylearna_agent` Marketplace row;
7. publishes it only when auto-publish is enabled;
8. creates a Pinterest Pin only when both auto-publish and auto-promote are enabled.

## Pinterest creative

Every active agent worksheet has a 1000 × 1500 image endpoint:

```text
/api/resource-factory/pinterest/[handle]
```

The image is generated from Marketplace metadata and links back to the worksheet landing page when used in Pinterest.

The Pinterest adapter creates an image-url Pin using the configured board and access token.

## Activation architecture

The intended production infrastructure is:

- Supabase Postgres: durable job/event/artifact state.
- Supabase Queues (`pgmq`): generate, QA, render, publish and promote work.
- Supabase Cron (`pg_cron`): keep the queue filled and invoke workers.
- Server-only workers: OpenAI Responses API generation/QA, PDF rendering, Storage upload, Marketplace projection.
- Pinterest API: create Pins after publish.
- Founder dashboard: show factory state, failures, throughput and winners.

Activation must keep queue access server-only.

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

## Current implementation slice

- structured worksheet and QA types;
- OpenAI generation and independent QA adapters;
- deterministic worksheet and answer-key PDFs;
- retrying pipeline runner;
- Marketplace projection with `source = mylearna_agent`;
- server-side Marketplace discovery and public worksheet detail pages;
- staged/published activation flags;
- dynamic 1000 × 1500 Pinterest image generation;
- Pinterest Create Pin adapter;
- secret-protected run-once smoke endpoint;
- design-only SQL for factory jobs, artifacts, events and engagement metrics.

## Activation checklist

1. Review and convert the SQL draft into a real Supabase migration using the repository's normal Supabase migration workflow.
2. Enable `pgmq` and `pg_cron` only through reviewed migration/configuration.
3. Create the generated-resource Storage bucket and its server-only write policy.
4. Configure `OPENAI_API_KEY`, Resource Factory model and run secret.
5. Keep `RESOURCE_FACTORY_AUTO_PUBLISH=false`.
6. Run one resource end to end and inspect the staged row, PDFs, QA metadata and visual.
7. Set `RESOURCE_FACTORY_AUTO_PUBLISH=true` and verify the public Marketplace landing page.
8. Configure Pinterest credentials and verify one manual Pin.
9. Set `RESOURCE_FACTORY_AUTO_PROMOTE=true`.
10. Add queue/cron workers and begin at 10 maths resources/day.
11. Add founder metrics and pricing-state transitions.
