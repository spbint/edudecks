# MyLearna Mathematics Experience Standard v1

## Purpose

MyLearna Mathematics is not a generic quiz platform.

It is a curriculum platform.

Every mathematics experience must feel visual, interactive, purposeful, and aligned to the curriculum source.

This standard applies to:

- My Pathways
- My Review
- Worksheets
- Practise activities
- Assess activities
- Review activities
- ActivityPlayer v5
- All mathematics strands

## Core Principle

The learner should interact with mathematics, not merely answer questions about mathematics.

Bad:

Question
A
B
C
D

Good:

See
Think
Move
Build
Rotate
Measure
Plot
Explain

## Worksheet Source of Truth Rule

For My Pathways, the worksheet PDF is the curriculum source of truth.

The digital Practise and Assess experience must visually resemble the worksheet.

The worksheet determines:

- context
- sequence
- visual model
- objects
- diagrams
- task type
- reasoning demand
- interaction type

A learner should recognise that the worksheet, Practise and Assess are the same learning experience in different formats.

## My Review Rule

My Review must use the same quality standard as My Pathways.

My Review is not allowed to become a generic quiz bank.

Even though My Review may not always have a worksheet attached, it must still use the same premium visual and interactive models.

My Review questions should be generated from the same component and visual model library as My Pathways.

If My Pathways uses:

- arrays
- grids
- fraction bars
- rulers
- clocks
- shape boards
- route maps
- place value blocks

then My Review must use those same models.

## Premium Subscription Rule

If a screen could exist unchanged inside a generic quiz plugin, it is not premium enough for MyLearna.

A premium MyLearna maths screen should include:

- a meaningful visual model
- interaction where appropriate
- clear instructional layout
- plausible answer options
- randomised answer order
- helpful feedback
- calm polished design
- mobile and touchscreen compatibility

## Visual Quality Rule

Every visual must be instructional.

Do not use visuals as decoration.

Every visual must answer:

Why is this here?

If the answer is:

It helps the learner solve, reason, compare, build, measure, move or explain

then it belongs.

If the answer is:

It decorates the question

then remove it.

## Visual Size Rule

The visual model should usually be larger than the answer area.

The visual is the lesson.

The answer is the check.

## No Generic Fallback as Final Product

Generic visual fallback is allowed only as a safety net.

It is not acceptable as the finished learning experience.

Finished activities must use task-specific visual models.

## Question-Specific Visual Rule

Do not use one generic visual board for a whole step.

Every question must have its own visual specification.

Each activity must define:

- worksheet section
- required visual
- objects
- targets
- correct state
- interaction type
- visual model
- feedback

## Answer Randomisation Rule

Correct answers must not always be option A.

Where multiple choice is used:

- use four options where practical
- use plausible distractors
- use seeded randomisation
- track answer-position distribution

## Touchscreen Rule

All interactive activities must work with:

- mouse
- touchscreen
- tablet
- interactive whiteboard

Every drag interaction must also support tap-to-select then tap-to-place.

## ActivityPlayer v5 Rule

ActivityPlayer v5 is the premium interactive maths engine.

ActivityPlayer v4 remains fallback only.

v5 should support:

- drag_to_place
- click_objects
- plot_coordinates
- rotate_shape
- flip_reflection
- build_array
- move_along_route
- interactive_ruler
- interactive_clock
- interactive_fraction_bar
- interactive_number_line
- build_place_value
- generic_money_model

## Practise and Assess Rule

Practise may include:

- hints
- retries
- scaffolds
- visual feedback

Assess should be cleaner but must still preserve the model.

Assess must not remove the representation.

Bad:

Practise uses map.
Assess asks text-only direction question.

Good:

Practise uses map.
Assess uses map.

## Strand Standards

### Geometry and Spatial Reasoning

A learner should manipulate space, not answer text questions about space.

Use:

- shapes
- maps
- grids
- routes
- coordinate boards
- transformations
- arrows
- floor plans
- layouts
- 3D objects
- nets
- symmetry boards

### Measurement

A learner should measure, compare, estimate and check.

Use:

- rulers
- clocks
- measuring jugs
- scales
- measuring tapes
- real objects
- unit labels
- estimate vs actual tables

### Fractions, Decimals and Percentages

A learner should see part-whole relationships.

Use:

- fraction strips
- circles
- bars
- decimal grids
- percentage grids
- equivalent model matching

### Operations and Calculation

A learner should build and manipulate operations.

Use:

- arrays
- equal groups
- number lines
- part-whole models
- bar models
- counters

### Number and Place Value

A learner should see number structure.

Use:

- ten frames
- counters
- place value blocks
- number lines
- digit cards
- regrouping models

### Algebra, Patterns and Functions

A learner should see relationships.

Use:

- repeating patterns
- growing patterns
- sorting rules
- input-output machines
- tables
- graphs
- balance models
- rule cards

## Money Model Rule

Because MyLearna serves Australia, the UK and the US, default money visuals should be generic unless a curriculum-specific task requires local currency.

Use:

- generic coins
- generic notes
- price tags
- wallet
- shop basket
- cash register

Currency symbols and local names should be a localisation layer.

Do not hard-code Australian coins as the default for all users.

## QA Release Standard

No mathematics task should be marked complete unless it passes:

1. Visual alignment review
2. Interaction review
3. Answer randomisation review
4. Touchscreen review
5. Practise/Assess consistency review
6. My Review compatibility review where relevant

Required QA question:

Would this screen feel premium enough for a paying subscriber?

If no, rebuild it.
