# Clean rebuild namespace

This folder is reserved for the isolated family-only MyLearna rebuild.

Rules:

- Do not import from `authority*`.
- Do not import from `exports*`.
- Do not import from `children/[id]`.
- Do not import from `start`.
- Do not import from `onboarding*`.
- Do not import from `useActiveStudent`.
- Do not import from `familyLearners`.
- Do not import from `familyLearnerService`.
- Do not import from school, classroom, teacher, admin, leadership, intervention, cohort, or ranking systems.

Phase 0 keeps this namespace non-routed and documentation-first.
