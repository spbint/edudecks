# MyLearna Assess: staff-only trusted-asset integration

## Status and boundaries

This is an integration candidate, implemented and fixture-tested locally. It has NOT been applied to the full repository, pushed to GitHub, built by Next.js, deployed to Vercel or validated against real staff authentication.

Target repository: `spbint/edudecks`.
Verified base: `329a872851d5891209587909c434ba7e78fcdde9` on `main`.
Keep this work in its own branch and draft PR, entirely separate from Resource Factory PR #210.

Sean approved the visual direction of the six diagrams in the supplied proof. That does not constitute psychometric calibration, complete accessibility review or publication approval for the questions. The original item records retain `reviewStatus: technical-candidate`.

No database migrations, Supabase writes, learner identities, assessment-attempt persistence, curriculum mappings, customer navigation, pricing or production flags are added. Existing assessment banks and the original Assessment Lab workspace remain intact. Responses are memory-only, with an optional local JSON download by the reviewer. Closing/reloading the page discards them.

## Source fidelity

The original six SVGs and their six PNG exports are copied byte-for-byte from `MyLearna-Assess-Six-Asset-Proof-Source-and-QA.zip`.

| Source diagram | Invariant |
| --- | --- |
| Number line | 0–20 with steps of 2; point P at 14 |
| Fraction bar | Eight equal parts, five shaded |
| Analogue clock | 3:25; minute hand 150°, hour hand 102.5° |
| Array | Three rows of four non-overlapping counters |
| Measurement | Strip endpoints at 2 and 9 on the same drawn ruler scale; length 7 cm |
| Geometry | Perpendicular edges and a right-angle marker |

Question wording, stable answer identifiers, explanations, hints and alternative descriptions are unchanged. SVG numeric labels are outlined paths in the approved source files. No fonts or image-authoring dependencies are added. These assets do not claim that a drawn centimetre measures a physical centimetre on a screen.

`assets/manifest.json` preserves the original hashes and item records. `items.generated.json` adds only protected delivery URLs. `assetBytes.generated.json` packs the original binary bytes for deterministic server bundling, avoiding a new filesystem tracing or storage deployment dependency. It is not an image renderer.

Run `python scripts/assessment-proof/sync-assets.py --check` to verify transport reproducibility. Without `--check`, the script re-encodes existing bytes but refuses any source/manifest hash mismatch. Never regenerate or edit the diagrams under an existing asset version.

## Routes and access

- Existing lab: `/assessment-lab` (preserved; conditional staff link added).
- New proof page: `/assessment-lab/assets-proof`.
- Protected assets: `/api/internal/assessment-lab/assets-proof/<exact-asset-id>.svg` or `.png`.

The proof is OFF unless `MYLEARNA_ASSESS_ASSET_PROOF=true` exactly, and is allowed only when:

1. `VERCEL_ENV=preview`; or
2. `VERCEL_ENV` is absent and `NODE_ENV=development` for local development.

`VERCEL_ENV=production` is always denied, even with the flag set. Unknown environments and absent flags fail closed. No environment files or Vercel project settings are changed by this patch. Enable the new flag only in the approved branch-specific Preview scope; do not alter Supabase secrets or promote the feature branch.

Both the page and every asset request call `getTrustedAssetProofAccess`. It reuses the existing `getServerAuthClient`, verifies the user with `auth.getUser`, fetches the user's `profiles.is_admin`, requires strict `true`, and applies the existing lab permission predicate. User-editable metadata, client role claims and email shortcuts are not trusted. There is no service-role client or elevated data access in this implementation. The existing client access panel is retained for consistency, but is not the asset authorization boundary.

The gate depends on the application's existing server authentication and trusted profile authority; this package does not claim to have independently audited live profile RLS. Verify the real environment before release. Authorised in this proof means the same administrator-backed staff model presently used by MyLearna, not every teacher/customer account.

Asset lookup is an exact allowlist, never a user-controlled path or URL fetch. Source bytes are checked server-side against length/hash. All asset responses, including errors, use private/no-store cache headers, noindex and nosniff. Content is not placed in `/public` and asset bytes are not imported by the client component. Item data is passed to the client only after server authorization.

The proof intentionally delivers answer keys to authorised staff and scores the technical samples in memory. This is NOT the security design for a future child-facing assessment: that later product requires server-authoritative attempts and scoring.

## Rendering ownership and states

React owns the empty mount container and cleanup. The preserved proof engine owns only its descendants. Its scoped CSS and visual assets are unchanged. One assessment image is active at a time; the optional source gallery has six thumbnails. SVG and PNG are alternative representations of the same source, not alternate questions.

The main diagram request must pass HTTP status, MIME, exact length, SHA-256 and decoded dimension checks before answer controls become available. Verified bytes are displayed through a Blob URL. The enlarge dialog reuses those verified bytes. Abort, timeout and generation guards prevent a delayed previous request from unlocking a later question; unmount revokes Blob URLs and detaches handlers.

Assess mode holds correctness feedback until completion. Practise mode has immediate feedback and optional hints. Incorrect, not known yet, not attempted and technical failures remain distinguishable. Diagram failure pauses the question; no score is recorded for the failure. Format switches preserve answer IDs and change only delivery representation. Responses are not saved remotely.

Mobile layout places the diagram before the response controls, preserves aspect ratio and supports enlargement. The reviewed artwork does not stretch or crop. User-facing question/item text has not been re-authored.

## Content Security Policy and host integration gate

This package does not modify the application's root layout, middleware, CSP, analytics, auth provider, dependencies or package lock.

The authenticated Preview must support same-origin asset fetches and Blob images for the player (`connect-src 'self'`, `img-src ... blob:` as applicable to its existing policy). Check the actual policy rather than weakening it globally. CSP headers on an SVG response restrict that SVG document; they do not replace the containing page's CSP.

Check real Next.js rendering, cookies/session refresh, auth redirects, role gating, route bundle protection, CSP and signed-out asset requests in Preview. Browser fixture tests are not evidence that those host boundaries work.

## Reproducible local checks

After applying the patch in a normal dependency-installed repository:

```sh
node scripts/assessment-proof/test-integration.cjs
node scripts/assessment-proof/test-delivery.cjs
node scripts/assessment-proof/test-logic.cjs
python scripts/assessment-proof/test-assets.py
python scripts/assessment-proof/sync-assets.py --check
npx tsc -p scripts/assessment-proof/tsconfig.json
python scripts/assessment-proof/test-browser.py
```

Python checks require Pillow and Playwright plus Chromium. The test loader uses the repository's TypeScript dependency (or global TypeScript in the isolated build environment). None of the fixtures add an authentication bypass to the application. Test scripts are not application routes and must not be imported by application code.

Set `PROOF_EVIDENCE_DIR` to a folder outside the worktree to avoid mixing generated evidence with source. The browser script starts and closes a loopback-only test server itself.

### Checks actually run for this candidate

| Layer | Result | Limits |
| --- | --- | --- |
| Asset geometry and source byte checks | 65 assertions passed | These samples only |
| Gate, page branch logic and asset route | 259 assertions passed | Auth/profile, Next navigation and JSX boundaries mocked |
| Delivery and hash verification | 62 assertions passed | Native Node Web Crypto, injected fetch invoking the real new route under mocked auth |
| Scoring and response distinctions | 174 assertions passed | Technical local scoring only |
| Browser rendering/interaction | 265 assertions passed | Chromium `set_content`, HTTP-byte bridge, mocked auth, about:blank digest bridge |
| Strict TypeScript | Passed | Player/types/environment only, not the full Next/React application |

The browser environment blocks navigation. Tests therefore set the document content to the integrated player and bridge asset bytes from the real route functions running in a local HTTP test server. Real Chromium decodes/renders the assets and handles interaction. Its about:blank cryptographic bridge is test-only; native cryptographic verification was tested separately in Node. This is NOT a Vercel/Next.js E2E test, a real staff-session test, React StrictMode certification or Safari/physical-device certification.

Screenshots cover desktop and phone for all six diagrams. Layout tests additionally cover tablet, 320px narrow phone and phone landscape. PNG is checked on desktop and phone. Corruption, wrong MIME, denied requests, timeouts, incorrect dimensions, missing crypto and retry are exercised. Local mounting/cleanup is checked; real React lifecycle remains a host test.

## Before calling the integration hosted-ready

1. Apply in a clean branch from the verified base, or reconcile newer main changes deliberately.
2. Run normal `npm ci`, full application typechecks, existing assessment tests and `npm run build`. No fake declarations or auth mocks in that build.
3. Open a separate DRAFT PR, not PR #210. Deploy only its exact head to Homeschool Preview. Keep Production untouched.
4. Set only the branch-scoped proof flag with approval. Check disabled, anonymous, signed-in nonstaff and authorised staff states against the actual application and asset routes.
5. Test real source-byte identity, browser CSP, SVG/PNG delivery, interruption/retry and mobile/tablet display in the hosted page. Check denied/disabled pages do not embed item data.
6. Verify no learner-related writes, no customer navigation link and no indexable public proof content.
7. Obtain educator review of the questions/accessibility and retain the sample disclaimer. This demonstration remains unsuitable for placement, percentiles or mastery claims.
8. Leave the PR draft until those gates pass. Do not merge, promote or enable customer assessments under this approval.
