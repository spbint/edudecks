import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const migration = readSource("supabase/migrations/20260907072856_free_v1_usage_guardrails.sql");
const platformMigration = readSource(
  "supabase/migrations/20260907101740_free_platform_abuse_protections.sql",
);
const learnerMigration = readdirSync(join(process.cwd(), "supabase/migrations"))
  .map((name) => readSource(`supabase/migrations/${name}`))
  .find((source) => source.includes("mylearna_enforce_learner_abuse_ceiling")) || "";

const learnerClient = readSource("lib/clean/learners/client.ts");
const profileWorkspace = readSource("app/components/clean/CleanProfileWorkspace.tsx");
const familyEvidence = readSource("lib/familyEvidence.ts");
const familyClient = readSource("lib/clean/family/client.ts");
const entitlementSource = readSource("lib/clean/entitlements/freeGuardrails.ts");
const evidenceClient = readSource("lib/clean/evidence/client.ts");
const unifiedCapture = readSource("lib/clean/evidence/unifiedCapture.ts");
const captureWorkspace = readSource("app/components/clean/CleanCaptureWorkspace.tsx");
const quickCaptureWorkspace = readSource("app/components/clean/CleanQuickCaptureWorkspace.tsx");
const portfolioWorkspace = readSource("app/components/clean/CleanPortfolioWorkspace.tsx");
const worksheetEvidenceCapture = readSource(
  "app/components/clean/pathways/WorksheetEvidenceCapture.tsx",
);
const reportPdfSource = readSource("lib/clean/outputs/pdf.ts");
const worksheetResourcesSource = readSource("lib/clean/resources/mathWorksheetResources.ts");

describe("MyLearna Free V1 learner guardrails", () => {
  it("enforces an abuse-only 20 learner ceiling in both UI and authoritative write paths", () => {
    expect(learnerClient).toContain("getLearnerAbuseCeilingState");
    expect(learnerClient).toContain('select("id", { count: "exact", head: true })');
    expect(learnerClient).toContain("LEARNER_ABUSE_CEILING_MESSAGE");
    expect(profileWorkspace).toContain("learnerAbuseCeilingState.canAddLearner");
    expect(profileWorkspace).toContain("learnerAbuseCeilingState.message");
    expect(profileWorkspace).toContain("Need support to add learners");
    expect(learnerMigration).toContain("mylearna_learner_abuse_ceiling_before_insert");
    expect(learnerMigration).toContain("mylearna_enforce_learner_abuse_ceiling");
    expect(learnerMigration).toContain("existing_learner_count >= 20");
    expect(learnerMigration).toContain("for update;");
    expect(learnerMigration).toContain("before insert on public.learners");
    expect(learnerMigration).toContain(
      "We couldn''t add another learner to this family. Please contact MyLearna support if you need help.",
    );
    expect(platformMigration).toContain("learner_abuse_ceiling_triggered");
    expect(platformMigration).toContain("mylearna_learner_creation_rate_limit_before_insert");
  });

  it("removes legacy customer-facing 3-learner Free copy", () => {
    expect(learnerClient).not.toContain("MyLearna Free supports up to 3 learners per family.");
    expect(profileWorkspace).not.toContain("MyLearna Free supports up to 3 learners per family.");
    expect(familyEvidence).not.toContain("MyLearna Free supports up to 3 learners per family");
  });

  it("does not delete, hide, or disable existing learner rows above the limit", () => {
    expect(learnerMigration).not.toContain("MyLearna Free supports up to 3 learners per family");
    expect(learnerMigration).not.toMatch(/delete\s+from\s+public\.learners/i);
    expect(learnerMigration).not.toMatch(/update\s+public\.learners\s+set/i);
    expect(profileWorkspace).toContain("workspace.learners.map");
  });
});

describe("MyLearna Free V1 platform circuit breakers", () => {
  it("keeps new family activation enabled by default but blockable at the DB write path", () => {
    expect(platformMigration).toContain("create table if not exists public.mylearna_runtime_controls");
    expect(platformMigration).toContain("'new_family_activation', true");
    expect(platformMigration).toContain("mylearna_enforce_new_family_activation_enabled");
    expect(platformMigration).toContain(
      "before insert on public.family_profiles",
    );
    expect(platformMigration).toContain(
      "MyLearna is temporarily pausing new family setup. Please try again shortly.",
    );
    expect(platformMigration).toContain("signup_temporarily_blocked");
    expect(familyClient).toContain("loadPlatformRuntimeControlState(\"new_family_activation\")");
    expect(familyClient).toContain("NEW_FAMILY_ACTIVATION_PAUSED_MESSAGE");
  });

  it("keeps existing authenticated families usable when activation is disabled", () => {
    expect(platformMigration).not.toContain("before update on public.family_profiles");
    expect(platformMigration).not.toContain("before insert on public.family_members");
    expect(platformMigration).not.toContain("on public.reports");
    expect(platformMigration).not.toContain("on public.report_exports");
    expect(platformMigration).not.toContain("on public.calendar_items");
  });

  it("blocks new evidence media uploads authoritatively while preserving text-only evidence creation", () => {
    expect(platformMigration).toContain("'evidence_media_uploads', true");
    expect(platformMigration).toContain("mylearna_runtime_control_enabled('evidence_media_uploads')");
    expect(platformMigration).toContain("mylearna_reserve_evidence_attachment_upload");
    expect(platformMigration).toContain("mylearna_evidence_attachment_upload_reserved");
    expect(platformMigration).toContain("mylearna_apply_storage_insert_to_free_quota");
    expect(platformMigration).toContain("evidence_upload_blocked");
    expect(platformMigration).toContain(
      "Media uploads are temporarily unavailable. You can still save a text learning record and use the rest of MyLearna.",
    );
    expect(unifiedCapture).not.toContain("mylearna_reserve_evidence_attachment_upload");
    expect(evidenceClient).toContain("normalizePlatformGuardrailMessage");
  });

  it("uses non-customer-facing runtime controls with no normal-user mutation access", () => {
    expect(platformMigration).toContain("alter table public.mylearna_runtime_controls enable row level security");
    expect(platformMigration).toContain("revoke all on public.mylearna_runtime_controls from authenticated");
    expect(platformMigration).toContain("grant execute on function public.mylearna_get_runtime_control_state(text) to authenticated");
    expect(platformMigration).not.toMatch(/create policy .*mylearna_runtime_controls/i);
    expect(`${captureWorkspace}\n${quickCaptureWorkspace}\n${portfolioWorkspace}`).not.toMatch(
      /circuit breaker|rate limit|Supabase|anti abuse/i,
    );
  });
});

describe("MyLearna Free V1 durable mutation throttles", () => {
  it("rate-limits only expensive mutation paths with generous fixed hourly windows", () => {
    expect(platformMigration).toContain("mylearna_mutation_rate_limit_buckets");
    expect(platformMigration).toContain("when 'evidence_attachment_reservation' then 120");
    expect(platformMigration).toContain("when 'evidence_record_creation' then 300");
    expect(platformMigration).toContain("when 'learner_creation' then 20");
    expect(platformMigration).toContain("window_seconds integer := 3600");
    expect(platformMigration).toContain("for update;");
    expect(platformMigration).toContain("expires_at < now()");
    expect(platformMigration).toContain("limit 500");
    expect(platformMigration).toContain(
      "That''s a lot of activity at once. Please wait a moment and try again.",
    );
  });

  it("scopes durable rate-limit state per family and user so one family cannot consume another", () => {
    expect(platformMigration).toContain("current_scope_key := p_family_id::text || ':' || auth.uid()::text");
    expect(platformMigration).toContain("primary key (scope_key, action_key, window_start)");
    expect(platformMigration).toContain("public.is_family_member(p_family_id)");
    expect(platformMigration).toContain("mylearna_evidence_record_rate_limit_before_insert");
    expect(platformMigration).toContain("before insert on public.evidence_entries");
    expect(platformMigration).toContain("mylearna_learner_creation_rate_limit_before_insert");
    expect(platformMigration).toContain("before insert on public.learners");
    expect(platformMigration).toContain("mylearna_enforce_mutation_rate_limit(");
  });

  it("records bounded guardrail events without sensitive child, email, filename, or evidence content", () => {
    expect(platformMigration).toContain("mylearna_guardrail_event_buckets");
    expect(platformMigration).toContain("event_scope_key text not null");
    expect(platformMigration).toContain("event_count = public.mylearna_guardrail_event_buckets.event_count + 1");
    expect(platformMigration).toContain("updated_at < now() - interval '30 days'");
    expect(platformMigration).not.toMatch(/child_name|learner_name|email|filename|file_name|what_happened|evidence_content/i);
  });
});

describe("MyLearna Free V1 portfolio storage guardrails", () => {
  it("uses the canonical family academic year for the 250 MB evidence attachment allowance", () => {
    expect(migration).toContain("family_evidence_storage_usage");
    expect(migration).toContain("primary key (family_id, academic_year_id)");
    expect(migration).toContain("262144000");
    expect(migration).toContain("public.academic_years");
    expect(migration).toContain("ay.starts_on <= target_observed_on");
    expect(migration).toContain("ay.ends_on >= target_observed_on");
    expect(migration).toContain("evidence_row.observed_on");
    expect(entitlementSource).toContain("FREE_FAMILY_PORTFOLIO_STORAGE_BYTES = 250 * 1024 * 1024");
  });

  it("counts only family-owned uploaded evidence attachment bytes from Supabase storage metadata", () => {
    expect(migration).toContain("from storage.objects obj");
    expect(migration).toContain("where obj.bucket_id = 'evidence'");
    expect(migration).toContain("public.mylearna_storage_metadata_size_bytes(obj.metadata)");
    expect(migration).toContain("join public.evidence_entries ee");
    expect(migration).toContain("(storage.foldername(obj.name))[1] = 'family'");
    expect(migration).toContain("(storage.foldername(obj.name))[5] = 'evidence'");
    expect(reportPdfSource).not.toContain("mylearna_reserve_evidence_attachment_upload");
    expect(worksheetResourcesSource).not.toContain("mylearna_reserve_evidence_attachment_upload");
  });

  it("reserves quota before upload and cleans up on upload or metadata failure", () => {
    const reserveIndex = familyEvidence.indexOf("await reserveFamilyEvidenceAttachmentUpload");
    const uploadIndex = familyEvidence.indexOf(".upload(objectPath");
    expect(reserveIndex).toBeGreaterThan(-1);
    expect(uploadIndex).toBeGreaterThan(-1);
    expect(reserveIndex).toBeLessThan(uploadIndex);
    expect(familyEvidence).toContain("releaseFamilyEvidenceAttachmentReservation(objectPath)");
    expect(familyEvidence).toContain("removeFamilyEvidenceFiles(uploaded)");
    expect(familyEvidence).toContain("FREE_PORTFOLIO_STORAGE_FULL_MESSAGE");
    expect(captureWorkspace).toContain("removeFamilyEvidenceFiles(uploadedAttachments)");
    expect(worksheetEvidenceCapture).toContain("removeFamilyEvidenceFiles([uploadedAttachment])");
  });

  it("handles exact allowance, overage, combined attachments, concurrency, and year separation server-side", () => {
    expect(platformMigration).toContain("mylearna_reserve_evidence_attachment_upload");
    expect(migration).toContain(
      "p_byte_size > greatest(0, usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes)",
    );
    expect(platformMigration).toContain(
      "p_byte_size > greatest(0, usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes)",
    );
    expect(migration).toContain("reserved_bytes = reserved_bytes + p_byte_size");
    expect(platformMigration).toContain("reserved_bytes = reserved_bytes + p_byte_size");
    expect(migration).toContain("for update");
    expect(migration).toContain("byte_size <= 10485760");
    expect(platformMigration).toContain("p_byte_size > 10485760");
    expect(migration).toContain("after insert on storage.objects");
    expect(migration).toContain("after delete on storage.objects");
    expect(migration).toContain("used_bytes = used_bytes + actual_size");
    expect(migration).toContain("used_bytes - coalesce");
    expect(migration).toContain("academic_year_id = target_year_id");
  });

  it("keeps historic evidence accessible and reduces current-year usage on supported deletion", () => {
    expect(migration).not.toMatch(/delete\s+from\s+public\.evidence_entries/i);
    expect(migration).not.toMatch(/delete\s+from\s+storage\.objects/i);
    expect(evidenceClient).toContain("summarizeFamilyEvidenceAttachments(existing.data)");
    expect(evidenceClient).toContain("await removeFamilyEvidenceFiles(storagePaths)");
    expect(evidenceClient.indexOf("await removeFamilyEvidenceFiles(storagePaths)")).toBeLessThan(
      evidenceClient.indexOf(".delete()"),
    );
  });

  it("leaves text-only capture, reports, PDFs, worksheet resources, and ordinary Pathways outside quota", () => {
    expect(unifiedCapture).not.toContain("mylearna_reserve_evidence_attachment_upload");
    expect(quickCaptureWorkspace).toContain("if (attachments.hasSelectedAttachments)");
    expect(captureWorkspace).toContain("if (filesToUpload.length)");
    expect(reportPdfSource).toContain("generateCleanReportPdfBytes");
    expect(reportPdfSource).not.toContain("family_evidence_storage_usage");
    expect(portfolioWorkspace).toContain("generateCleanReportPdfBytes");
    expect(worksheetEvidenceCapture).toContain("download={worksheetResource.fileName}");
    expect(worksheetResourcesSource).toContain("href:");
  });

  it("shows restrained storage messages without fake paid upgrade flows", () => {
    expect(captureWorkspace).toContain("portfolioStoragePresentation.message");
    expect(quickCaptureWorkspace).toContain("portfolioStoragePresentation.message");
    expect(portfolioWorkspace).toContain("portfolioStoragePresentation.message");
    expect(
      `${familyEvidence}\n${captureWorkspace}\n${quickCaptureWorkspace}\n${portfolioWorkspace}`,
    ).not.toMatch(/Upgrade now|Stripe|checkout|paid storage/i);
  });

  it("does not let abuse protections multiply or alter the family/year media allowance", () => {
    expect(platformMigration).not.toMatch(/allowance_bytes\s*=\s*allowance_bytes\s*\+/i);
    expect(platformMigration).not.toMatch(/learner_id.*allowance_bytes/i);
    expect(platformMigration).not.toMatch(/per learner|per_learner/i);
    expect(`${migration}\n${platformMigration}\n${entitlementSource}`).toContain("262144000");
  });
});
