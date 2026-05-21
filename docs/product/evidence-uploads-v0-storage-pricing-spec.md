# Evidence Uploads V0 - Storage and Pricing Spec

## Purpose

MyLearna already works well as a text-first mobile capture tool. That is a strength, especially for quick one-thumb evidence notes on a phone. Uploads still matter because many homeschool families naturally want to capture:

- photos of written work
- worksheets
- project builds
- hands-on activities
- annotated pages
- visual proof of progress

Uploads should be treated as optional evidence support, not the default evidence model. Storage introduces ongoing cost, privacy risk, moderation risk, and product-support overhead. Because of that, uploads should not be enabled until quota rules, storage rules, deletion behaviour, and pricing boundaries are defined.

## Upload Scope

### V1 recommended scope

V1 should support:

- photo/image upload only

This matches the strongest parent need and the most common mobile workflow. It also keeps storage, preview, privacy, and PDF decisions manageable.

### Later scope

Later phases can consider:

- PDF/file upload
- audio note upload
- short video only if there is a clear paid-tier and storage strategy

### Recommendation

Do not include video in the early phase. Video is the fastest way to create storage cost blowouts, slow mobile uploads, and more complicated privacy handling.

## Free Tier Recommendation

### Options considered

#### Option A - Text-only free

Pros:

- lowest storage cost
- simplest support model
- easiest abuse control
- keeps the current strong mobile text-first workflow

Cons:

- some families will expect at least basic photo evidence
- portfolio/report flows may feel less complete for work samples

#### Option B - Very limited free photo allowance

Pros:

- lets families test the upload experience
- gives a clearer upgrade path

Cons:

- still creates storage and support cost
- introduces quota edge cases immediately
- free users may treat the allowance as a normal archive

#### Option C - Uploads only in paid tier

Pros:

- clean pricing boundary
- easier to justify storage cost
- lower abuse risk

Cons:

- makes first-time evaluation harder for families who want visual evidence

### Recommended free-tier position

Recommended launch position:

- keep free tier text-first at launch
- do not enable general free photo uploads in the first rollout
- optionally allow a very small trial allowance later if conversion testing supports it

This is the safest initial decision. MyLearna already has useful value without uploads, and text capture should stay fast and primary. Uploads should be introduced only when the paid-tier rules are clear.

## Paid Tier Recommendation

Recommended future tier shape:

### Basic / Free

- text evidence only
- no ongoing image storage, or a tightly limited test allowance if product later chooses to trial it

### Family / Premium

- photo upload enabled
- family-level storage quota
- enough image allowance for normal homeschool evidence capture
- image support in portfolio and report workflows

### Pro / Authority

- larger storage allowance
- more generous export/report support
- better support for authority-facing records
- potential future access to PDF/file upload

### Recommendation

Keep uploads as a paid differentiator unless usage data later proves that a small free allowance materially improves activation without harming cost control.

## Quota Recommendations

These numbers are conservative starting recommendations for planning, not final product commitments.

### Per-file limits

- max image selected before compression: 20 MB
- reject anything above the hard cap before upload
- accept common mobile formats only at first: JPEG, PNG, HEIC if conversion is supported, WebP

### Stored image target

- resize to longest edge around 1600 to 2000 px
- compress to web-friendly JPEG or WebP
- target stored size around 300 KB to 1.2 MB per image
- hard cap stored image around 1.5 MB unless a premium exception is introduced later

### Family-level quota

Recommended initial planning model:

- Family / Premium: 1 GB to 2 GB total family storage
- Pro / Authority: 5 GB to 10 GB total family storage

### Monthly upload allowance

Recommended planning model:

- Family / Premium: 100 to 250 new images per month
- Pro / Authority: 500 to 1000 new images per month

### Recommendation

Use both:

- a family-level total storage cap
- a monthly new-upload allowance

That protects against both long-term storage growth and short-term abuse spikes.

## Compression Strategy

Photo capture should be compressed before upload where possible.

### Recommended strategy

- perform client-side resize/compression on mobile and web
- preserve enough clarity for written work, diagrams, worksheets, and project photos
- prefer JPEG or WebP output
- strip unnecessary original size and metadata where safe

### Quality targets

- clear enough to read handwriting and worksheet answers
- not intended for print-quality original archiving
- avoid storing full original camera files in early tiers

### Premium exception

If original-quality storage is ever introduced, it should be a deliberate higher-tier feature with tighter quotas, not the V1 default.

## Storage Architecture

### Recommended provider approach

Use Supabase Storage with private access only.

### Bucket design

Recommended early bucket shape:

- one private bucket for evidence uploads

Example:

- `evidence-uploads`

### Path structure

Recommended object path pattern:

- `family/{familyId}/learner/{learnerId}/evidence/{evidenceId}/{assetId}.webp`

This keeps storage aligned to family ownership and learner/evidence lookup.

### Access model

- private bucket only
- no public bucket for child evidence
- short-lived signed URLs for view/download
- signed URL generation only for authenticated, authorised users

### Storage policy direction

- family-scoped access only
- uploads limited to the owning family
- reads limited to the owning family
- deletes limited to the owning family
- no anonymous object access

### Recommendation

Do not rely on public URLs for child evidence. Use private storage plus signed URLs from the start.

## Privacy and Safety

Evidence uploads often contain child work, names, handwriting, photos, and family context. This should be treated as sensitive private data.

### Core privacy rules

- private access only
- no public browseable links
- no indexable asset URLs
- no shared bucket paths across families without strict isolation

### Delete behaviour

When a parent deletes an uploaded attachment later, the system should remove:

- the file object
- the attachment metadata
- any references from portfolio/report views where applicable

### Retention direction

Retention should remain parent-controlled where possible, but a later product policy should define:

- soft delete vs hard delete timing
- backup retention window
- export implications after deletion

### Recommendation

Deletion behaviour must be designed before rollout. Parents need to trust that child evidence can be removed deliberately and privately.

## Report and Output Behaviour

Uploads should not force an early rebuild of reports or PDFs.

### Early behaviour recommendation

In the early upload phase:

- reports can show a thumbnail or attachment reference
- portfolio can surface uploaded images as part of selected evidence
- outputs can mention that evidence includes an attached image

### Later behaviour

Later phases can consider:

- embedding selected images directly into PDFs
- appendix sections for attachments
- limited PDF/file attachment listings

### Audio and file recommendation

For file or audio uploads later:

- reference them in a report appendix or evidence list first
- do not attempt full inline embed in the earliest phase

## Abuse and Cost Protection

Uploads require guardrails before release.

### Required controls

- file type validation
- file size validation
- client-side pre-checks before upload
- server-side quota checks
- rate limiting for repeated uploads
- family-level usage tracking

### Later controls

- malware scanning if file uploads expand beyond images
- better moderation tooling if public/community sharing ever touches uploads

### Recommendation

No video in the early phase. No general file upload in the first phase. Start with images only because they are the easiest to validate, compress, and understand.

## User Experience Direction

Uploads should support the current text-first workflow, not replace it.

### Future My Capture UX

- text evidence remains primary
- photo upload is optional
- mobile camera and photo library should be supported
- show image preview before save
- show clear upload progress
- allow attachment delete before final save

### UX principle

The capture note should still work well if the parent never uploads anything. Uploads should feel helpful, not required.

## Open Decisions

The following product decisions still need explicit sign-off before implementation:

- whether free tier includes any image upload allowance
- exact paid-tier quota numbers
- exact family-level storage caps
- exact monthly upload caps
- image compression dimensions and quality targets
- whether HEIC is converted client-side or server-side
- whether portfolio/report previews show thumbnails only or embedded images
- whether PDFs will embed selected images in the first upload release
- whether audio is included before PDF/file upload
- whether storage remains exclusively on Supabase Storage
- whether quota enforcement is count-based, storage-based, or both
- whether deleted uploads are hard-deleted immediately or after a short recovery window

## Recommendation for Next Phase

Do not enable uploads yet.

Recommended prerequisites before implementation:

- define free vs paid upload allowance
- define family storage quotas and monthly upload limits
- design private storage and signed URL rules
- define delete and retention behaviour
- implement client-side image compression
- confirm how uploads appear in portfolio, reports, and outputs

### Clear next implementation recommendation

When MyLearna is ready to move forward, the next build phase should be:

- image uploads only
- paid-tier first
- private Supabase Storage
- client-side compression required
- thumbnails/reference support before full PDF embedding

That is the safest path to unlock mobile evidence photos without creating uncontrolled storage cost, privacy risk, or product-support complexity.
