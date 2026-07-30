# Idea-to-Learning build audit

## Reused infrastructure

- The existing intelligence lesson and unit plan tables, plan versions, review APIs and `lib/intelligence/plans/library.ts` remain canonical.
- The existing V2 application shell, My Ideas source-preview and generation flow remain in use.
- Calendar, family, learner, evidence, capture and portfolio behaviour continues to use the clean client/types and existing workspaces.
- The existing authenticated Supabase browser/server boundaries are used; no elevated client or service-role path was added.

## New boundaries

- `sql/clean/20260730_idea_to_learning.sql` adds only nullable plan linkage and delivery metadata to calendar and evidence records, plus bounded checks and indexes.
- `/share` validates HTTP(S) links and redirects to a confirmed My Ideas prefill.
- My Plans reads the canonical lesson and unit plan tables directly through the authenticated server context.
- Plan mutations are centralized in `lib/intelligence/plans/mutations.ts`; scheduling is centralized in `lib/intelligence/plans/scheduling.ts`.
- Scheduling stores the exact plan version and a safe snapshot with a deterministic duplicate key.

## Deferred capabilities

REST/vendor connectors, scheduler workers, credentials, recommendation/preparation links, commerce, baskets, automatic application of canonical changes, and a second calendar/evidence/portfolio system remain outside this build.

## Activation gates

The migration must be applied through the approved database process before plan-linked scheduling and evidence fields are available. Existing RLS remains responsible for family isolation. Production deployment and activation were intentionally not performed in this local build.

## Known limitations

The local schedule surface currently hands the parent to the canonical Calendar workspace for date/learner selection; the server still fetches and snapshots the plan. Existing Calendar, My Day and Capture screens remain the source of truth for those areas and require their current staging data/configuration for a complete browser smoke path.

