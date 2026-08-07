# Unauthenticated Demo Evidence Dataset

The public demo uses a fictional Carter Family dataset owned entirely by the
demo layer. It contains Sarah Carter, Emma Carter and Noah Carter, with a
2025–2026 learning year and a March 2026 reporting period.

There are 10 demo evidence records covering literacy, reading, maths, science,
art, nature, STEM, geography and project reflection. Every record is explicitly
eligible for the demo Portfolio and demo Report views. The records contain no
production identifiers, account state or persisted family data.

Each record has a deterministic `imageKey` using the `demo-*` convention, an
alt-text-ready `imageAlt`, and an `imagePlaceholder`. The current UI renders a
safe placeholder rather than an image. The next step is to generate and attach
AI demo images to these slots without changing the data shape.
