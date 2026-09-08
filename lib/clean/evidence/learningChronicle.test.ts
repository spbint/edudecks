import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const migration = readSource("supabase/migrations/20260907114710_shared_learning_chronicles.sql");
const evidenceClient = readSource("lib/clean/evidence/client.ts");
const unifiedCapture = readSource("lib/clean/evidence/unifiedCapture.ts");
const quickCapture = readSource("app/components/clean/CleanQuickCaptureWorkspace.tsx");
const portfolioWorkspace = readSource("app/components/clean/CleanPortfolioWorkspace.tsx");
const portfolioPresentation = readSource("lib/clean/portfolio/evidencePresentation.ts");
const storageGuardrailMigration = readSource("supabase/migrations/20260907072856_free_v1_usage_guardrails.sql");
const abuseGuardrailMigration = readSource("supabase/migrations/20260907101740_free_platform_abuse_protections.sql");

describe("Learning Chronicle shared capture", () => {
  it("uses one evidence row with participant links instead of duplicate learner evidence rows", () => {
    expect(migration).toContain("create table if not exists public.evidence_entry_learner_links");
    expect(migration).toContain("evidence_entry_id uuid not null references public.evidence_entries(id) on delete cascade");
    expect(migration).toContain("constraint evidence_entry_learner_links_unique unique (evidence_entry_id, learner_id)");
    expect(migration).toContain("mylearna_sync_primary_evidence_learner_link");
    expect(migration).toContain("insert into public.evidence_entry_learner_links");
    expect(evidenceClient).toContain("participantLearnerIds");
    expect(evidenceClient).toContain("loadEvidenceIdsForParticipantLearner");
    expect(evidenceClient).toContain("query.in(\"id\", linkedEvidenceIds)");
    expect(evidenceClient).not.toMatch(/for\s*\([^)]*participantLearnerIds[^)]*\)[\s\S]*createCleanEvidenceEntry/);
  });

  it("keeps shared media physically attached to the canonical evidence row once", () => {
    expect(quickCapture).toContain("studentId: result.entry.learnerId");
    expect(quickCapture).toContain("evidenceId: result.entry.id");
    expect(quickCapture).toContain("participantLearnerIds,");
    expect(quickCapture).not.toMatch(/selectedLearnerIds\.map[\s\S]*uploadSelectedAttachments/);
    expect(storageGuardrailMigration).toContain("primary key (family_id, academic_year_id)");
    expect(storageGuardrailMigration).toContain("262144000");
    expect(storageGuardrailMigration).toContain("byte_size <= 10485760");
  });

  it("adds a text-first learning moment UX with optional media and multi-learner selection", () => {
    expect(quickCapture).toContain("Record a learning moment");
    expect(quickCapture).toContain("Tell MyLearna what happened");
    expect(quickCapture).toContain("Who was involved?");
    expect(quickCapture).toContain("Choose one or more learners before saving.");
    expect(quickCapture).toContain("type=\"checkbox\"");
    expect(quickCapture).toContain("Optional photo or file");
    expect(quickCapture).toContain("Tell MyLearna what happened before saving.");
    expect(quickCapture).toContain("Choose at least one learner for this learning note.");
    expect(quickCapture).not.toContain("Learning Chronicle");
    expect(quickCapture).not.toMatch(/subject.*required|calendar.*required/i);
  });

  it("implements browser-only speech input without persisted audio or paid transcription", () => {
    expect(quickCapture).toContain("SpeechRecognition");
    expect(quickCapture).toContain("webkitSpeechRecognition");
    expect(quickCapture).toContain("Speak");
    expect(quickCapture).toContain("Stop");
    expect(quickCapture).toContain("appendSpeechTranscript");
    expect(quickCapture).toContain("Only the text you keep is saved to MyLearna.");
    expect(quickCapture).not.toMatch(/audioBlob|Whisper|OpenAI|transcription API|MediaRecorder|supabase\.storage[\s\S]*audio/i);
  });

  it("keeps Chronicle text outside media quota and media failure recoverable", () => {
    expect(unifiedCapture).toContain('"learning-chronicle"');
    expect(unifiedCapture).toContain("captureSource: cleanCaptureSource(draft.sourceType)");
    expect(unifiedCapture).not.toContain("mylearna_reserve_evidence_attachment_upload");
    expect(quickCapture).toContain("if (attachments.hasSelectedAttachments)");
    expect(quickCapture).toContain("The learning moment was saved, but the attachment needs another try.");
    expect(quickCapture).toContain("setSavedEntry(result.entry)");
  });

  it("surfaces shared learning moments in Portfolio without treating them as assessment or mastery", () => {
    expect(portfolioPresentation).toContain("Learning Moment");
    expect(portfolioPresentation).toContain("buildEvidenceLearnerLabel");
    expect(portfolioWorkspace).toContain("evidenceIncludesLearner(item, selectedLearnerId)");
    expect(portfolioWorkspace).toContain("buildEvidenceLearnerLabel(item.evidence, learnerLabelById)");
    expect(portfolioWorkspace).toContain("This removes this learning record for");
    expect(unifiedCapture).toContain("curriculumNodeIds: draft.curriculumNodeIds ?? []");
    expect(quickCapture).toContain("curriculumNodeIds: []");
    expect(quickCapture).not.toContain("assessment_skill_statuses");
  });

  it("preserves Free v1 abuse and storage guardrails unchanged", () => {
    expect(abuseGuardrailMigration).toContain("when 'evidence_record_creation' then 300");
    expect(abuseGuardrailMigration).toContain("when 'evidence_attachment_reservation' then 120");
    expect(abuseGuardrailMigration).toContain("existing_learner_count >= 20");
    expect(abuseGuardrailMigration).toContain("'evidence_media_uploads', true");
    expect(storageGuardrailMigration).toContain("262144000");
    expect(storageGuardrailMigration).toContain("p_byte_size > 10485760");
    expect(storageGuardrailMigration).toContain("public.academic_years");
  });
});
