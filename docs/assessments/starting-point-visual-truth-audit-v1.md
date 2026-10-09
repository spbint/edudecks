# Starting Point visual truth audit V1

## Scope and evidence-integrity rule

This audit covers the complete active **MyLearna Maths Starting Point — Number & Operations** estate. It locks the rule that MyLearna must never make an educational claim unless the mathematical evidence presented to the learner matches the canonical construct and item definition.

The five continua remain independent: Number and place value, Counting processes, Additive strategies, Multiplicative strategies, and Understanding money. This audit does not change scoring, routing, progression, evidence policy, recommendations, persistence, or release state.

## Method

The executable audit derives its inventory from the same initial-placement and fresh/recheck registries used by renderer coverage. It does not copy the item bank. For every active item it:

1. resolves one of `canonical-visual`, `presentation-visual`, or `text-or-symbol-sufficient`;
2. derives a concise mathematical truth signature for every visual item;
3. compares the canonical-item signature with the adapted player-input signature;
4. verifies prompt, stimulus, response contract, and canonical correct answer coherence;
5. verifies single-select answer uniqueness and distractor safety;
6. explicitly resolves every text-only item flagged by visual-reference language; and
7. preserves item/version, continuum, progression, form, evidence, and accessibility provenance.

The deterministic TSV inventory is produced by `formatStartingPointVisualTruthInventory()` in `startingPointVisualTruthAudit.ts`.

## Complete inventory

| Classification | Count |
| --- | ---: |
| Canonical visual | 19 |
| Presentation visual | 30 |
| Text/symbol sufficient | 171 |
| **Active estate** | **220** |

The 49 visual items comprise 26 initial-placement items and 23 fresh/recheck items.

| Visual family | Count |
| --- | ---: |
| Counter set | 10 |
| Counter groups | 17 |
| Closed groups | 8 |
| Place value / base-ten | 3 |
| Canonical Australian currency | 6 |
| Repeated Australian currency | 5 |
| **Visual total** | **49** |

By continuum, the visual inventory contains 3 Number and place value, 11 Counting processes, 12 Additive strategies, 12 Multiplicative strategies, and 11 Understanding money items.

## Renderer semantic invariants

- Counter sets preserve the canonical quantity. Shadows, rims, highlights, and stage decoration are parts of a counter, not additional countable counters.
- Counter groups preserve the ordered group quantities. The inventory includes 9 combine, 3 remove, 4 share, and 1 display-only representation.
- Combine keeps the original groups visible and does not replace them with a pre-solved answer.
- Remove marks exactly `removeCount` source objects and derives `remainingCount` without removing other objects.
- Share preserves the source collection and renders exactly `recipientCount` recipient symbols.
- Closed groups preserve the number of containers, each displayed group quantity, object label, and total.
- Place-value signatures preserve thousands, hundreds, tens, and ones and prove `representedValue = 1000t + 100h + 10x + o`.
- Repeated currency preserves denomination and count and derives the total in cents.
- Canonical currency preserves the exact denomination multiset and total.
- The trusted base-ten specification remains 10 units per rod, 10 × 10 units per hundred flat, and 10 × 10 × 10 units per thousand cube.
- The trusted Australian coin registry remains 5c, 10c, 20c, 50c, $1, and $2. The 50c coin alone is 12-sided; the other five are circular. Approved relative diameter and alloy specifications remain unchanged.

## Prompt, stimulus, and answer coherence

All 49 visual items have a resolved, machine-verifiable prompt/stimulus/response contract. Counter totals, removal remainders, sharing results, closed-group totals, represented place values, repeated-coin totals, canonical coin counts, face-value selections, and denomination orderings are compatible with the existing canonical correct response. Every visual single-select item retains exactly one canonical correct option, and no distractor is made equivalent by the rendered truth.

The learner-facing presentation copy is audited where it safely replaces legacy “money token” language with “coin” language. Internal item IDs, answer keys, and rule names are not presented on the learner route.

## Text/symbol-sufficient review

The audit scans prompts and option labels for likely visual references including shown, picture, collection, counter, coin, block, group, object, share, take away, remove, and diagram. It currently flags 32 candidates.

Every candidate has an explicit deterministic resolution. They are limited to:

- symbolic uses of words such as “shows”;
- fully specified word problems where all quantities and actions are stated;
- fully specified symbolic collections in response options; or
- zero concepts for which displaying objects would contradict the intended empty-set evidence.

No keyword candidate is silently passed and no candidate remains unresolved.

## Defects and corrections

No mathematical defect or canonical-content defect was found.

One evidence-surface lifecycle defect was confirmed: a required Phaser mathematical stimulus could briefly expose an empty lavender panel and, for numeric presentation items, usable answer controls before the visual was ready. The player now shows the neutral status **“Preparing question…”** while a required visual initializes. Numeric answer controls and the accessible response controls remain disabled until the scene has created the mathematical visual. Plain numeric-entry items with no visual remain immediate and do not initialize Phaser.

## Security and human review

The protected staff route `/assessments/maths-starting-point/visual-truth` calls the server-side assessment-lab access check before deriving or serialising the audit inventory. Unauthenticated requests cannot receive canonical items, answer keys, or staff truth metadata. The real learner route remains limited to its current answer-safe item flow.

The staff surface provides filters for canonical visuals, presentation visuals, base-ten, counters, additive, multiplicative, currency, remove, share, and closed groups. Each inventory card provides the learner prompt and a concise staff-only expected truth, with one selected item rendered through the actual commercial player for visual inspection.

Human review should use this protected surface after renderer or asset changes. Such review is an evidence-integrity check; it does not enable persistence or customer release.

## Conclusion

The executable estate has 220 resolved classifications, 49 resolved visual signatures, 32 resolved text-only candidates, and zero unresolved mathematical ambiguities.

**ASSESSMENT VISUAL TRUTH = PASS**

Persistent Educational Intelligence capture is not enabled by this audit.
