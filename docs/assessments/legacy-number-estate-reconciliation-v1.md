# Legacy Number assessment estate reconciliation v1

Status: **version-controlled reconciliation of the 3 October 2026 v0.3 overlay; placement use remains staff/lab only**

## Why this exists

MyLearna now has two distinct Number assessment estates:

1. the established 16-bank Number library (192 items), built originally for bank-based assessment and targeted practice; and
2. the new trusted adaptive placement estate for the Number & Operations baseline.

The parent product must not become two competing assessment systems. This reconciliation freezes the legacy estate, records what may be reused, and makes the boundary between legacy learning/check content and placement evidence explicit.

## Frozen estate

- 16 legacy Number banks
- 12 items per bank
- 192 legacy items total
- 140 separate draft placement items in the current Number & Operations trusted placement registry

The 140 placement items are not counted as replacements for the 192. They are the trusted routing/boundary estate for the adaptive baseline.

## Recovered v0.3 overlay

The 3 October 2026 provisional overlay produced:

| Decision | Count |
| --- | ---: |
| Keep candidate | 135 |
| Rewrite | 13 |
| Hold for broader Australian Curriculum Mathematics layer | 44 |
| **Total** | **192** |

Source fit:

| Source fit | Count |
| --- | ---: |
| Direct fit | 134 |
| Partial fit | 14 |
| Held broader Mathematics | 44 |
| **Total** | **192** |

The overlay also identified **78 potentially reusable items** for the first five Number & Operations continua.

Those 78 are candidates, not automatically trusted placement items.

## Five-continuum candidate coverage

| Continuum | Legacy reuse candidates | Audited anchor reuse |
| --- | ---: | ---: |
| Number and place value | 22 | 4 |
| Counting processes | 0 | 0 |
| Additive strategies | 15 | 1 |
| Multiplicative strategies | 23 | 4 |
| Understanding money | 18 | 2 |
| **Total** | **78** | **11** |

Counting Processes remains an explicit legacy gap. It is covered by newly authored placement material rather than by pretending that an old bank measures the source construct.

## What "audited anchor reuse" means

Only 11 legacy items have so far passed the tighter source/construct review strongly enough to be referenced directly by the Number & Operations routing-anchor blueprint.

That does not mean the other 67 candidates are bad content. They may remain useful for:

- targeted practice;
- mini-checks;
- post-learning verification;
- pathway-linked evidence;
- future boundary pools after review.

It means they are not automatically entitled to make a placement claim.

## Overlay methodology

The recovered v0.3 method is encoded in code and guarded by tests:

1. source fit;
2. progression placement;
3. placement eligibility;
4. reuse decision;
5. source indicator;
6. visual / interaction action.

The item-level overlay is deliberately conservative:

- direct source fits remain Keep candidates;
- partial fits are Rewrite by default unless explicitly accepted;
- upper Mathematics content outside the Numeracy progression stays held for the broader Mathematics layer;
- the first-slice Number & Operations candidate set is explicit;
- trusted placement reuse is derived from the current anchor blueprint, not from bank membership.

## Product rule

The parent-facing utility remains:

**Assess → locate → explain → recommend → learn → capture → recheck**

Parents should never need to choose among 16 banks or 192 items.

The adaptive engine chooses evidence. My Pathways explains the result and gives the next useful action.

## Next gate

Before any parent release:

1. finish construct review of the 78 first-slice candidates;
2. keep only audited placement evidence in routing/boundary pools;
3. preserve the remainder as practice / mini-check content where appropriate;
4. promote trusted placement items out of draft only after hosted and mobile QA;
5. then port the accepted engine onto a fresh branch from current main rather than merging the long-lived lab branch wholesale.
