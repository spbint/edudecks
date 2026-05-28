# Upper Number Assessment Response Type Strategy

## 1. Purpose

The Upper Number assessment banks should reduce reliance on parent-marked open responses. Parents of upper-primary and secondary learners may be confident supporting learning routines, but may not be confident judging whether a mathematical explanation about surds, irrational numbers, exponent laws, or approximation error is correct.

MyLearna should therefore move more reasoning into structured, auto-checkable response formats. The goal is not to remove reasoning. The goal is to assess reasoning through carefully designed choices, classifications, matches, orderings, gaps, and worked-solution selections that reveal misconceptions without requiring the parent to be the marker.

Open response should remain available for deeper reasoning, reflection, or optional adult review, but it should not carry most of the scoring load in a 12-item diagnostic bank.

## 2. Recommended Scoring Philosophy

- Auto-check most mathematical reasoning through structured formats.
- Keep open response for limited deeper reasoning, usually 1-2 items per 12-item bank.
- Treat parent review as interpretation support, not the main scoring mechanism.
- Prefer structured misconception evidence over broad free-text explanations.
- Future AI can assist open-response review, but the MVP assessment engine should not depend on AI to score core items.
- Preserve item snapshots so future renderers and audit views can explain why an answer was marked correct, incorrect, or needing review.
- Use exact expected values for symbolic/numeric responses only when normalization is reliable; otherwise use structured options.

## 3. Response Type Catalogue

### Multiple Choice

Description: The learner chooses one answer from several options.

Example use in Number: "Which pair is correctly matched: 121 and sqrt(121) = 11, 81 and sqrt(81) = 9/2, ...?"

How it can be checked: Store one `expectedAnswer` matching one option. Mark correct when the selected option equals the expected answer.

Useful misconception targets: classification errors, base/exponent confusion, powers-of-ten place-value errors, exact-vs-approximate confusion.

When to use it: Use when one misconception-rich distractor set can test a specific idea.

When not to use it: Avoid when the item needs multiple true statements or a sequence of steps.

### Multi-Select

Description: The learner chooses all options that apply.

Example use in Number: "Select all irrational numbers: sqrt(2), 0.25, pi, 7/8, sqrt(49)."

How it can be checked: Store a required set of selected option values. Auto-check by exact set equality, optionally with partial-credit metadata later.

Useful misconception targets: rational/irrational classification, recurring-decimal rational confusion, pi-as-rational error.

When to use it: Use when several answers can be correct and the key skill is discriminating categories.

When not to use it: Avoid when one option is enough to diagnose the skill or when all options are too dependent on each other.

### Numeric Answer

Description: The learner enters a number.

Example use in Number: "Calculate sqrt(169)."

How it can be checked: Normalize commas, spaces, and simple decimal formatting; compare against `expectedAnswer` and `acceptableAnswers`.

Useful misconception targets: square-root perfect-square confusion, rounding-place-value error, decimal-operation error.

When to use it: Use for clear numeric outcomes where equivalent forms are limited.

When not to use it: Avoid when the mathematically correct answer has many equivalent symbolic forms unless normalization is robust.

### Short Symbolic Answer

Description: The learner enters a compact expression such as `6^4`, `2^3 x 3^2`, or `5sqrt(3)`.

Example use in Number: "Write 72 as a product of prime powers."

How it can be checked: Compare normalized symbolic strings against acceptable forms. Include order variants where multiplication order is flexible.

Useful misconception targets: exponent-notation confusion, prime-factorisation exponent error, surd simplification factor error.

When to use it: Use when the expected expression has a manageable list of equivalent text forms.

When not to use it: Avoid for complex algebraic equivalence unless a symbolic parser is introduced.

### Matching

Description: The learner pairs prompts with corresponding answers.

Example use in Number: Match `5 x 5 x 5`, `sqrt(144)`, `10^3`, and `2^3 x 3^2` with their meanings or values.

How it can be checked: Store expected pairs as prompt-key to response-key mappings. Auto-check by exact mapping.

Useful misconception targets: repeated-multiplication confusion, square-root connection errors, powers-of-ten place-value errors.

When to use it: Use when several related representations need to be connected.

When not to use it: Avoid when every pair can be guessed by process of elimination without testing the target idea.

### Ordering

Description: The learner arranges values or steps in a correct order.

Example use in Number: Order `sqrt(5)`, `2.3`, `sqrt(8)`, and `3` from smallest to largest.

How it can be checked: Store an expected ordered array. Auto-check by exact sequence.

Useful misconception targets: number-line placement error, square-root estimation error, approximation-treated-as-exact.

When to use it: Use when relative size or process order is central.

When not to use it: Avoid when only the largest or smallest value matters.

### Classification

Description: The learner sorts items into categories.

Example use in Number: Sort numbers into rational, irrational, perfect square, non-perfect square, exact, or approximate.

How it can be checked: Store expected category for each item. Auto-check by exact item-category mapping.

Useful misconception targets: rational/irrational classification error, pi-as-rational error, recurring-decimal rational confusion.

When to use it: Use when category boundaries reveal conceptual understanding.

When not to use it: Avoid if the categories are ambiguous or overlap without explicit instruction.

### Select the Correct Working

Description: The learner chooses the worked solution that is mathematically valid.

Example use in Number: "Which working correctly simplifies 8^6 / 8^2?"

How it can be checked: Store one correct working option. Distractors should reflect common error paths, such as multiplying exponents or changing the base.

Useful misconception targets: exponent-law multiplication error, exponent-law division error, rationalising-denominator error, coefficient-surd distribution error.

When to use it: Use when reasoning process matters but free-text marking would burden parents.

When not to use it: Avoid when all wrong workings are obviously absurd rather than diagnostically useful.

### Choose the Best Explanation

Description: The learner selects the explanation that best justifies a result.

Example use in Number: "Why is 10^0 = 1?" with several explanation choices.

How it can be checked: Store one best explanation, or a ranked set if future partial credit is needed.

Useful misconception targets: zero-exponent confusion, exact-vs-decimal form confusion, reasonableness-not-checked.

When to use it: Use to assess conceptual reasoning without requiring a parent to judge prose.

When not to use it: Avoid when the skill is producing an explanation independently.

### Fill the Gap

Description: The learner completes one or more missing pieces in a statement or worked solution.

Example use in Number: "Since 6^2 = __ and 7^2 = __, sqrt(41) lies between __ and __."

How it can be checked: Store expected values for each gap. Auto-check each gap and the full set.

Useful misconception targets: square-root estimation error, rounding-place-value error, surd simplification factor error.

When to use it: Use when a scaffolded reasoning chain should be checked step by step.

When not to use it: Avoid when the answer requires a broad explanation rather than specific missing values.

### True/False with Correction Choice

Description: The learner decides whether a statement is true or false, then chooses the correction if false.

Example use in Number: "True or false: 3^5 means 3 x 5. If false, choose the correct meaning."

How it can be checked: Store the expected truth value and correction option. Mark correct only when both are correct.

Useful misconception targets: base-vs-exponent confusion, truncation-vs-rounding confusion, exact-form-vs-decimal error.

When to use it: Use when a common misconception can be stated directly and corrected.

When not to use it: Avoid when the statement is too easy to label false without understanding the correction.

## 4. Coverage Recommendation

A single 12-item bank cannot contain two of every response type. Trying to do so would make the bank too broad and would weaken progression coverage.

Recommended coverage:

- Each 12-item bank should include a balanced subset of response types.
- Across the full Upper Number engine, each major response type should appear at least twice.
- Open-response items should generally be capped at 1-2 per 12-item bank.
- Structured reasoning should replace many free-text explanation items.
- Banks should include at least one item that checks reasoning process, not only final answers.
- Banks should include at least one item that checks misconception correction.

## 5. Recommended Item Type Distribution for a 12-Item Bank

Recommended default distribution:

- 2 multiple choice
- 1 multi-select
- 2 numeric / short symbolic
- 1 matching or classification
- 1 ordering
- 2 structured reasoning items:
  - select the correct working
  - choose the best explanation
- 1 fill-the-gap
- 1 true/false with correction choice
- 1 open response / adult review

This can flex by topic. For example, Real numbers may use more classification and ordering; Surds may use more select-the-correct-working and fill-the-gap; Approximation may use more choose-the-best-explanation and true/false correction.

## 6. Current-Bank Audit

### Powers and Roots

Current answer type mix:

- numeric: 2
- multiple_choice: 2
- short_answer: 5
- worked_response: 1
- explain_or_justify: 2

Open-response/adult-review items: 3 of 12.

Open-response items:

- `powers-roots-factor-tree-007`: Interpret a prime factorisation from a factor tree
- `powers-roots-zero-exponent-011`: Explain the meaning of a zero exponent
- `powers-roots-efficiency-012`: Explain why exponent notation is efficient

Audit note: Parent burden is moderate. The zero-exponent and notation-efficiency items can become structured explanation checks.

### Real Numbers

Current answer type mix:

- multiple_choice: 5
- short_answer: 3
- worked_response: 2
- explain_or_justify: 2

Open-response/adult-review items: 4 of 12.

Open-response items:

- `irr-real-circle-area-008`: Write the exact area of a circle in terms of pi
- `irr-real-radicand-010`: Explain why one square root is rational and another is irrational
- `irr-real-triangle-area-011`: Calculate an exact area involving a square root
- `irr-real-context-012`: Explain the difference between an exact and approximate real-number answer

Audit note: This bank relies too much on parent review. Several items can be converted to classification, choose-best-explanation, fill-the-gap, or select-correct-working.

### Surds and Exact Form

Current answer type mix:

- short_answer: 6
- numeric: 1
- multiple_choice: 2
- worked_response: 2
- explain_or_justify: 1

Open-response/adult-review items: 3 of 12.

Open-response items:

- `surds-exact-multi-step-009`: Simplify an expression with several surd terms
- `surds-exact-rationalise-binomial-011`: Rationalise a denominator using a conjugate
- `surds-exact-why-exact-012`: Explain why exact surd form can be preferable

Audit note: Parent burden is moderate, but the two worked-response items are high-marking-demand items. They are good candidates for select-correct-working or fill-the-gap.

### Approximation and Error

Current answer type mix:

- numeric: 3
- multiple_choice: 4
- short_answer: 1
- explain_or_justify: 2
- worked_response: 2

Open-response/adult-review items: 4 of 12.

Open-response items:

- `approx-reasonableness-008`: Explain whether an estimate is reasonable
- `approx-measurement-context-010`: Analyse approximation in an area estimate
- `approx-circumference-context-011`: Compare a circumference estimate with the calculated value
- `approx-repeated-calculation-012`: Reason about repeated rounding in a financial model

Audit note: This bank relies too much on parent review. Approximation reasoning can often be checked through choose-best-explanation, true/false correction, or fill-the-gap.

## 7. Proposed Conversion Plan

### Powers and Roots

- Convert `powers-roots-factor-tree-007` to select-the-correct-working or fill-the-gap. The learner can choose the prime-power representation produced by a factor tree.
- Convert `powers-roots-zero-exponent-011` to choose-the-best-explanation. Keep a short optional explanation field later if desired.
- Keep `powers-roots-efficiency-012` as the one open-response item, or convert it to choose-the-best-explanation if the bank needs zero parent review.

Target open-response count: 1.

### Real Numbers

- Convert `irr-real-circle-area-008` to short symbolic answer or fill-the-gap: area formula, substitution, exact answer.
- Convert `irr-real-radicand-010` to choose-the-best-explanation.
- Convert `irr-real-triangle-area-011` to select-the-correct-working.
- Keep `irr-real-context-012` as the one open-response item, or convert it to true/false with correction choice.
- Add classification or multi-select for rational/irrational examples if replacing one existing multiple-choice item.

Target open-response count: 1.

### Surds and Exact Form

- Convert `surds-exact-multi-step-009` to fill-the-gap or select-the-correct-working.
- Convert `surds-exact-rationalise-binomial-011` to select-the-correct-working, because conjugate errors are highly diagnosable.
- Keep `surds-exact-why-exact-012` as the one open-response item, or convert it to choose-the-best-explanation.
- Consider matching equivalent surd forms in one lower-scaffold item.

Target open-response count: 1.

### Approximation and Error

- Convert `approx-reasonableness-008` to choose-the-best-explanation.
- Convert `approx-measurement-context-010` to fill-the-gap with exact area, rounded area, and error comparison.
- Convert `approx-circumference-context-011` to select-the-correct-working or true/false with correction choice.
- Keep `approx-repeated-calculation-012` as the one open-response item because repeated rounding reasoning may benefit from adult interpretation.
- Consider ordering estimates by reasonableness or error size.

Target open-response count: 1.

## 8. Required Player-Model Implications

The current `CleanNumberAssessmentPlayer` supports:

- `multiple_choice` with one selected option
- `numeric` via text input and normalized answer matching
- `short_answer` via text input and normalized answer matching
- `worked_response` as review-needed
- `explain_or_justify` as review-needed

Unsupported future item types:

- `multi_select`
- `matching`
- `ordering`
- `classification`
- `select_the_correct_working`
- `choose_the_best_explanation`
- `fill_the_gap`
- `true_false_with_correction`

Minimal future additions:

- Extend the item type union with new structured answer types.
- Add response payload helpers that can serialize structured responses into a stable text or JSON string.
- Add renderer branches for checkbox lists, match pairs, ordered lists, category sorting, worked-solution choice cards, explanation choice cards, gap inputs, and true/false plus correction.
- Add checker helpers per structured type instead of relying only on normalized text.
- Keep result states unchanged for MVP: `correct`, `incorrect`, `review_needed`, `unanswered`.
- Continue showing adult review only for true open-response items.

## 9. Persistence Implications

The current saved response model can support MVP structured types without immediate schema changes:

- `response_text`: can store normalized text or serialized structured response JSON.
- `selected_option`: can store the primary selected option for single-choice structured items.
- `item_snapshot`: can store the full item definition, options, expected mappings, category lists, ordering lists, and future scoring metadata.

Future needs:

- A dedicated structured response JSON column would improve querying, but is not required for the first refactor.
- Partial-credit scoring would eventually benefit from item-level score fields, but the MVP can remain correct/incorrect/review-needed.
- If analytics later need per-gap or per-match reporting, store that detail in `item_snapshot` and `response_text` first before proposing schema changes.

Recommendation: do not change schema for the next implementation phase.

## 10. Recommended Next Implementation Phase

After this spec is reviewed:

1. Add player support for the new auto-checkable structured item types.
2. Add typed item-model support for structured response data.
3. Refactor the four upper Number banks to cap open response at 1-2 items per bank.
4. Re-run lint/build and local item-count/type audits.
5. Only after the structured types are stable, consider whether analytics or persistence need richer response storage.
