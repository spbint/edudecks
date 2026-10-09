# Learning Evidence Persistence V1

## Status and containment

This is a local/staff persistence foundation for `LearningEvidenceResultV1`.
It does not enable customer persistence, evidence writes, Portfolio inclusion,
My Pathways mutation, or any Starting Point release gate. The migration is
repository source only and has not been applied to Production Supabase.

The integrated architecture base is
`be97a7a4092f41ae8a11ba268b2ed697bb9ff0f7`. It combines the Mathematics
Learning Profile at `0fa96e1fb7ba8876f349bb0988e67e182f99d1b6` with the
Assessment Visual Truth Audit at
`8f8539994cabb0f827e7a403def81dd21fdb5d25`.

## Educational authority boundary

The browser is not an authority for an educational interpretation.

The current Starting Point flow has these boundaries:

1. The learner receives one answer-safe item from the protected item route.
2. The score route resolves the canonical item by ID/version and calls the
   deterministic `scoreAssessmentItem` implementation on the server.
3. The interactive React runner currently executes adaptive stage selection and
   continuum completion in the browser.
4. For persistence, the existing dormant save boundary submits response
   evidence, not a trusted `LearningEvidenceResultV1`.
5. `sanitizeNumberOperationsBaselinePersistenceDraft` resolves every item from
   the canonical registry, validates its pool/progression metadata and re-scores
   the response. Browser-supplied correctness, skill and item snapshots are
   replaced.
6. `buildTrustedNumberOperationsBaselinePersistenceDraft` deterministically
   replays the allowed adaptive route and rejects a browser placement/profile
   that differs from the replayed result.
7. `projectTrustedStartingPointPersistence` rebuilds attempt traces and the
   completion snapshot from that replayed evidence, then invokes the approved
   pure `LearningEvidenceResultV1` projection.
8. Only those server-projected records are suitable for the repository save.

This provides a complete server-validation bridge for the current Number &
Operations evidence supplied by a completed attempt. It does not make the
customer route write-enabled: `persistenceEnabled` remains `false`, the real
runner does not invoke the save client, and the database RPC is not executable
by `anon` or `authenticated` browser roles.

## Existing tenancy reused

The model reuses the clean family architecture:

- `family_profiles` is the tenancy root;
- `family_members` links an authenticated user to a family;
- `learners.family_id` binds each learner to one family;
- `is_family_member(uuid)` is the established RLS ownership helper;
- `profiles.is_admin` plus `requireAssessmentLabAccess` remains the governed
  staff-preview policy.

No parallel account, school, family or learner identity was introduced.

## Storage model

`learning_evidence_attempts` stores an append-safe assessment attempt envelope.
It is indexed for learner chronology and assessment/module history. One attempt
may produce multiple construct-level results.

`learning_evidence_results` stores one immutable educational interpretation per
construct. Query columns retain family, learner, module, assessment/version,
attempt identity/kind, continuum, construct, developmental status, evidence
sufficiency, evidence ceiling and evaluated time. The exact canonical V1 payload
is retained as JSONB for contract fidelity, including item/version evidence,
deterministic rule/version, curriculum mapping, limitations and recommendation
provenance.

`learning_evidence_result_reviews` separates later mutable human-control state
from immutable assessment history. Its initial states are `not-reviewed`,
`not-confirmed` and `not-decided`. This batch creates no customer mutation policy
or review endpoint.

No learner name, family name, email, prompt, correct answer or media is copied
into these records.

## Atomicity and idempotency

The service-role-only, security-invoker
`mylearna_save_learning_evidence_results_v1` function performs one transaction.
It validates actor family membership and learner ownership before inserting.
The Number & Operations assessment requires five independent continuum records;
focused attempts still contain five canonical records, with out-of-scope areas
remaining explicitly unknown.

The canonical attempt identity is family + learner + assessment/version +
attempt identity + result schema version. Result identity additionally includes
the construct. Canonical JSON hashes distinguish safe retries from conflicts:

- same identity and same content reuses the existing attempt/results;
- same identity and different educational content raises a conflict;
- a recheck uses a new attempt identity and appends history;
- attempt and result update/delete triggers prevent destructive replacement.

The recommendation at each point in time remains inside the immutable result.
`pathwayMutation` is constrained to `not-requested`.

## RLS and API exposure

All three tables have RLS enabled. Authenticated family members receive read
access only when `auth.uid()` is present, `is_family_member(family_id)` is true,
and the learner belongs to that family. Anonymous access and authenticated table
writes are revoked. The atomic function is revoked from `public`, `anon` and
`authenticated` and granted only to `service_role`; no service credential is
present in client code.

The staff My Results preview uses synthetic fixtures and the existing protected
assessment-lab gate. It performs no read or write against Supabase and is not
linked from customer navigation.

## Local validation boundary

The migration was created with Supabase CLI `2.120.0`. This workstation does not
have Docker or `psql`, so genuine local PostgreSQL migration/RLS acceptance
could not be executed in this batch. Unit storage tests and executable migration
contract tests are not described as PostgreSQL acceptance.

Before a separately authorised non-production persistence smoke test:

1. provide a disposable Supabase local stack or Preview branch with the clean
   family baseline schema;
2. apply the migration there, never to Production;
3. run authenticated family A/family B/anonymous RLS probes and the atomic RPC;
4. verify a five-result round trip, identical retry, conflict rejection and
   original/recheck chronology;
5. run database lint/advisors and inspect the resulting policies/grants.

Until that happens, the repository foundation is code-complete but database
acceptance remains explicitly unproven.
