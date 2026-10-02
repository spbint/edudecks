# Founder Behaviour Intelligence v3 analytics taxonomy

This private Founder surface uses server-side, bounded PostHog reads. It never renders raw analytics IDs, auth IDs, email addresses, IP addresses, precise locations, filenames, learner names, image contents or learning content.

## Reused events

- Public: `public_session_source`, `public_demo_started`, `public_signup_started`, public report/resource view and download.
- Authentication: page viewed, email submitted, challenge sent/failed, verification started/succeeded/failed, session ready, product entry and callback outcomes.
- Product: `app_page_viewed`, `product_signed_in`, My Day, Pathways, Portfolio and Reports.
- Capture: standard/quick open, attachment selected/finalised/failed, save succeeded, evidence created and Portfolio-after-Capture.
- Output: report preview and learning-record/plan PDF events.

## New minimum events

| Event | Purpose | Safe properties |
| --- | --- | --- |
| `public_page_viewed` | Explicit public route measurement because the direct capture integration does not produce `$pageview` | `page_path`, `public_source` |
| `pwa_session_started` | Distinguish an installed standalone launch from phone browser use | `displayMode`, `viewportCategory` |
| `pwa_install_prompt_shown` | Measure browser install eligibility | `displayMode`, `viewportCategory` |
| `pwa_install_accepted` / `pwa_install_dismissed` | Record the browser prompt outcome when exposed | `displayMode`, `viewportCategory`, `installOutcome` |
| `pwa_installed` | Record the browser `appinstalled` signal | `displayMode`, `viewportCategory` |
| `capture_attachment_source_selected` | Record the picker intent selected by the adult | `attachmentSource`, `sourceSurface`, `area`, `viewportCategory`, `displayMode` |

`attachmentSource` means the selected control (`camera`, `photo_library`, `file_picker`), not guaranteed physical provenance. Mobile browsers may offer a different source after a control is selected. The current file-input flow does not use `getUserMedia`, so camera permission request/grant/deny events are intentionally not invented.

## Identity and internal traffic

The existing `$identify` event safely supplies `$anon_distinct_id` to merge the browser's anonymous ID into the authenticated ID. Sign-out now clears the local analytics ID so account switching on a shared browser cannot continue the prior identity. The Founder UI treats anonymous-to-authenticated progression as directional unless the merged PostHog actor proves continuity.

Known Founder and disposable test-account authenticated IDs are excluded by default using the existing server-side account classification. The Founder can include them with an explicit toggle. Anonymous internal browsing cannot be safely recognised and is disclosed as a limitation. `$virt_traffic_type` is not used as the human filter because current genuine MyLearna events are classified as Automation.

## Data quality and sample policy

- Standard `$pageview` is absent because this application sends direct capture events instead of using `posthog-js`.
- Public and authenticated retention remain separate.
- Cohort percentages require at least five actors.
- Profile completion, learner creation and planning setup do not have timestamped events and remain labelled missing instrumentation.
- Event counts and actor counts are shown separately. No causal interpretation is inferred from sequence alone.
