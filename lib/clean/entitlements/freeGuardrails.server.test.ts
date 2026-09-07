import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const migration = readSource(
  "supabase/migrations/20260907072856_free_v1_usage_guardrails.sql",
);
const learnerClient = readSource("lib/clean/learners/client.ts");
const profileWorkspace = readSource("app/components/clean/CleanProfileWorkspace.tsx");
const familyEvidence = readSource("lib/familyEvidence.ts");
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
  it("enforces the 3 learner family limit in both UI and authoritative write paths", () => {
    expect(learnerClient).toContain("getFreeLearnerLimitState");
    expect(learnerClient).toContain('select("id", { count: "exact", head: true })');
    expect(learnerClient).toContain("FREE_FAMILY_LEARNER_LIMIT_MESSAGE");
    expect(profileWorkspace).toContain("learnerLimitState.canAddLearner");
    expect(profileWorkspace).toContain("learnerLimitState.message");
    expect(migration).toContain("mylearna_enforce_free_learner_limit");
    expect(migration).toContain("for update;");
    expect(migration).toContain("existing_learner_count >= 3");
    expect(migration).toContain("before insert on public.learners");
  });

  it("does not delete, hide, or disable existing learner rows above the limit", () => {
    expect(migration).not.toMatch(/delete\s+from\s+public\.learners/i);
    expect(migration).not.toMatch(/update\s+public\.learners\s+set/i);
    expect(profileWorkspace).toContain("workspace.learners.map");
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
    expect(migration).toContain("p_byte_size > greatest(0, usage_row.allowance_bytes - usage_row.used_bytes - usage_row.reserved_bytes)");
    expect(migration).toContain("reserved_bytes = reserved_bytes + p_byte_size");
    expect(migration).toContain("for update");
    expect(migration).toContain("byte_size <= 10485760");
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
    expect(`${familyEvidence}\n${captureWorkspace}\n${quickCaptureWorkspace}\n${portfolioWorkspace}`).not.toMatch(
      /Upgrade now|Stripe|checkout|paid storage/i,
    );
  });
});
