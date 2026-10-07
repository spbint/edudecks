# MyLearna Maths Starting Point — trusted mathematical asset remediation

Date: 7 October 2026
Starting SHA: `11128d3646719b1bf1824985d5813e21e5f7ba64`
Scope: base-ten/place value and Australian money assets only

## Historical QA resolution

The historical QA numbers resolve against the ordered 220-item active renderer inventory:

| Historical QA | Canonical item ID | Form | Stimulus |
| --- | --- | --- | --- |
| 77 | `myl-recheck-cnt-p07-b-v1` | fresh recheck | 6 tens and 4 ones |
| 79 | `myl-anchor-cnt-p07-b-v1` | initial placement | 4 tens and 7 ones |
| 141 | `myl-anchor-npv-p03-b-v1` | initial placement | 1 ten and 6 ones |

These three items are the complete active base-ten visual inventory.

## Audited estate

- 220 active initial-placement and fresh-recheck items checked by the coverage inventory.
- 3 active base-ten stimuli.
- 46 active Understanding Money items.
- 6 canonical Australian coin stimuli.
- 5 presentation-only repeated-coin stimuli.
- 11 active currency visual uses in total.

## Asset remediation

The base-ten family now uses one shared specification and one visual language for:

- unit cube;
- ten rod divided into 10 equal units;
- hundred flat divided into a 10 × 10 grid; and
- thousand cube with 10 × 10 visible face grids and three-dimensional depth.

The DOM and Phaser renderers share the same material palette and decimal-structure specification. The former mixed colours, text-labelled thousand block, and generic rounded shapes have been removed.

The Australian coin family now covers `5c`, `10c`, `20c`, `50c`, `$1`, and `$2`. It uses the trusted physical diameters `19.41`, `23.6`, `28.65`, `31.65`, `25`, and `20.5` millimetres respectively. The `50c` is the only 12-sided coin. Silver/gold alloy treatment, denomination-specific classroom motifs, rim detail, and `AUSTRALIA` labelling replace the previous generic chip/token treatment.

Learner presentation metadata replaces “money token” wording with “Australian coin” or “coin” for the nine active prompts where the depicted objects are coins. Canonical IDs, item versions, response keys, scorer inputs, and routing metadata are unchanged.

## Staff QA

The staff-only trusted-asset review route provides direct shortcuts for:

- historical QA 77;
- historical QA 79;
- historical QA 141;
- all active base-ten visuals; and
- all active currency visuals.

Each trusted visual is rendered in explicit 390px and 430px review frames. The separate currency review route also shows the complete six-coin set at both widths.

## Automated coverage and preserved boundaries

Coverage tests lock:

- historical QA-to-item resolution;
- all active base-ten and currency uses;
- all 46 Understanding Money items;
- decimal base-ten structure;
- all six Australian coin diameters;
- 50c 12-sided geometry;
- learner coin wording;
- currency `pending-review` status; and
- all eight release booleans remaining `false`.

Existing canonical scorer comparison, item-ID/version inventory, renderer-family, progression, routing, evidence, persistence, and customer-release blocker tests remain in place.

No Supabase file or state was changed. Production was not touched. PR #220 was not merged. No real-route integration was started.

## Verification status

- Targeted trusted-asset and Starting Point contract suite: 12 files, 52 tests passed.
- Production TypeScript check: passed.
- Changed-file ESLint check: passed, excluding one unchanged `AssessmentPlayerV1` purity warning already present at the starting SHA.
- Browser screenshot review: not completed because the in-app QA browser was unavailable in this session.
- Currency approval remains `pending-review`; this implementation is ready for human 390px/430px hosted visual acceptance, not self-approved.
