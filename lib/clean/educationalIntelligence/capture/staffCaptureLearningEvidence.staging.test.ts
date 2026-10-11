import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  governStaffCaptureEvidence,
  loadStaffCaptureEvidenceHistory,
  parseStaffCaptureEvidenceRequest,
  StaffCaptureLearningEvidenceError,
} from "./staffCaptureLearningEvidence.server";

const FAMILY_A = "41000000-0000-4000-8000-000000000001";
const LEARNER_A = "42000000-0000-4000-8000-000000000001";
const FAMILY_B = "41000000-0000-4000-8000-000000000002";
const LEARNER_B = "42000000-0000-4000-8000-000000000002";
const EVIDENCE_A = [
  "43000000-0000-4000-8000-000000000001",
  "43000000-0000-4000-8000-000000000002",
  "43000000-0000-4000-8000-000000000003",
] as const;
const EVIDENCE_B = "43000000-0000-4000-8000-000000000004";
const ADDITIVE = "MYL-MATH-AU-NUMERACY-V9::additive-strategies::at-least-P10";
const COUNTING = "MYL-MATH-AU-NUMERACY-V9::counting-processes::at-least-P8";
const MONEY = "MYL-MATH-AU-NUMERACY-V9::understanding-money::at-least-P10";
const PASSWORD = "Staging-only-capture-EI-acceptance-2026!";

const runStaging =
  process.env.RUN_CAPTURE_EI_STAGING_ACCEPTANCE === "true" ? describe : describe.skip;

function required(name: string) {
  const value = String(process.env[name] ?? "").trim();
  if (!value) throw new Error(`${name} is required for genuine staging acceptance.`);
  return value;
}

function authenticatedClient(url: string, key: string) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

runStaging("Capture -> EI genuine intelligence-staging acceptance", () => {
  let service: SupabaseClient;
  let familyAClient: SupabaseClient;
  let familyBClient: SupabaseClient;
  let userA: User;
  let userB: User;
  let rawBefore: unknown;
  let resultsBefore: unknown;
  let attemptsBefore: unknown;
  let queueBefore: unknown;

  beforeAll(async () => {
    expect(required("EI_STAGING_SUPABASE_PROJECT_REF")).toBe("owvxggviughmpursepof");
    const url = required("EI_STAGING_SUPABASE_URL");
    expect(new URL(url).hostname).toBe("owvxggviughmpursepof.supabase.co");
    const serviceKey = required("EI_STAGING_SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = required("EI_STAGING_SUPABASE_ANON_KEY");
    service = authenticatedClient(url, serviceKey);

    const createUser = async (label: "a" | "b") => {
      const email = `capture-ei-acceptance-${label}@mylearna.test`;
      const existing = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const previous = existing.data.users.find((candidate) => candidate.email === email);
      if (previous) await service.auth.admin.deleteUser(previous.id);
      const created = await service.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { purpose: "capture-ei-staging-acceptance" },
      });
      if (created.error || !created.data.user) throw created.error ?? new Error("User creation failed.");
      return created.data.user;
    };
    [userA, userB] = await Promise.all([createUser("a"), createUser("b")]);
    const familyB = await service.from("family_profiles").upsert({
      id: FAMILY_B,
      created_by_user_id: userB.id,
      display_name: "EI Capture acceptance Family B",
    });
    if (familyB.error) throw familyB.error;
    const memberships = await service.from("family_members").upsert([
      { family_id: FAMILY_A, user_id: userA.id, role: "owner", created_by_user_id: userA.id },
      { family_id: FAMILY_B, user_id: userB.id, role: "owner", created_by_user_id: userB.id },
    ], { onConflict: "family_id,user_id" });
    if (memberships.error) throw memberships.error;
    const learnerB = await service.from("learners").upsert({
      id: LEARNER_B,
      family_id: FAMILY_B,
      first_name: "Synthetic Learner B",
      created_by_user_id: userB.id,
    });
    if (learnerB.error) throw learnerB.error;
    const evidenceB = await service.from("evidence_entries").upsert({
      id: EVIDENCE_B,
      family_id: FAMILY_B,
      learner_id: LEARNER_B,
      observed_on: "2026-10-09",
      title: "Synthetic tenant B capture",
      what_happened: "Disposable non-production cross-tenant control record.",
      learning_area: "Mathematics",
      curriculum_node_ids: [],
      attachment_urls: [],
      include_in_portfolio: false,
      include_in_report: false,
      created_by_user_id: userB.id,
      capture_source: "my_capture",
      created_at: "2026-10-09T13:00:00.000Z",
      updated_at: "2026-10-09T13:00:00.000Z",
    });
    if (evidenceB.error) throw evidenceB.error;
    const participantB = await service.from("evidence_entry_learner_links")
      .select("id")
      .eq("family_id", FAMILY_B)
      .eq("evidence_entry_id", EVIDENCE_B)
      .eq("learner_id", LEARNER_B)
      .maybeSingle();
    if (participantB.error || !participantB.data) {
      throw participantB.error ?? new Error("Tenant B participant link was not created.");
    }

    familyAClient = authenticatedClient(url, anonKey);
    familyBClient = authenticatedClient(url, anonKey);
    const [sessionA, sessionB] = await Promise.all([
      familyAClient.auth.signInWithPassword({ email: userA.email!, password: PASSWORD }),
      familyBClient.auth.signInWithPassword({ email: userB.email!, password: PASSWORD }),
    ]);
    if (sessionA.error || sessionB.error) throw sessionA.error ?? sessionB.error;

    await service.from("learning_evidence_artifact_links").delete().in("evidence_entry_id", [...EVIDENCE_A, EVIDENCE_B]);
    const [raw, results, attempts, queue] = await Promise.all([
      service.from("evidence_entries").select("*").in("id", [...EVIDENCE_A]),
      service.from("learning_evidence_results").select("id,canonical_content_hash,canonical_payload").eq("family_id", FAMILY_A).eq("learner_id", LEARNER_A).order("id"),
      service.from("learning_evidence_attempts").select("id,canonical_content_hash,evaluated_at").eq("family_id", FAMILY_A).eq("learner_id", LEARNER_A).order("id"),
      service.from("learning_plan_items").select("id,updated_at").eq("family_profile_id", FAMILY_A).eq("student_id", LEARNER_A).order("id"),
    ]);
    if (raw.error || results.error || attempts.error || queue.error) throw raw.error ?? results.error ?? attempts.error ?? queue.error;
    rawBefore = raw.data;
    resultsBefore = results.data;
    attemptsBefore = attempts.data;
    queueBefore = queue.data;
  }, 60_000);

  afterAll(async () => {
    if (!service) return;
    if (userA) await service.from("family_members").delete().eq("user_id", userA.id);
    if (userB) await service.from("family_members").delete().eq("user_id", userB.id);
    if (userA) await service.auth.admin.deleteUser(userA.id);
    if (userB) await service.auth.admin.deleteUser(userB.id);
    await service.from("family_profiles").delete().eq("id", FAMILY_B);
  }, 60_000);

  it("persists governed, tenant-safe links and reloads the genuine multi-source timeline", async () => {
    const actorUserId = userA.id;
    const link = async (
      evidenceId: string,
      constructId: string,
      sourceType: "work-sample" | "parent-observation" | "practical-observation",
    ) => governStaffCaptureEvidence({
      client: service,
      actorUserId,
      request: { operation: "link-capture-evidence", familyId: FAMILY_A, learnerId: LEARNER_A, evidenceId, constructId, sourceType },
    });

    const first = await link(EVIDENCE_A[0], ADDITIVE, "work-sample");
    expect(first.reused).toBe(false);
    await link(EVIDENCE_A[0], COUNTING, "work-sample");
    await link(EVIDENCE_A[1], ADDITIVE, "parent-observation");
    await link(EVIDENCE_A[2], MONEY, "practical-observation");
    expect((await link(EVIDENCE_A[0], ADDITIVE, "work-sample")).reused).toBe(true);
    await expect(link(EVIDENCE_A[0], ADDITIVE, "parent-observation")).rejects.toMatchObject({ status: 409 });

    for (const reviewState of ["reviewed", "confirmed-relevant", "not-relevant", "unreviewed"] as const) {
      const reviewed = await governStaffCaptureEvidence({
        client: service,
        actorUserId,
        request: { operation: "review-capture-evidence-link", familyId: FAMILY_A, learnerId: LEARNER_A, evidenceId: EVIDENCE_A[1], constructId: ADDITIVE, reviewState },
      });
      expect(reviewed.link.reviewState).toBe(reviewState);
      expect(reviewState === "unreviewed" ? reviewed.link.reviewedByActorId : actorUserId).toBe(reviewed.link.reviewedByActorId);
    }

    const ownRead = await familyAClient.from("learning_evidence_artifact_links").select("id,canonical_construct_id");
    expect(ownRead.error).toBeNull();
    expect(ownRead.data).toHaveLength(4);
    const otherRead = await familyBClient.from("learning_evidence_artifact_links").select("id");
    expect(otherRead.error).toBeNull();
    expect(otherRead.data).toEqual([]);
    const anonymous = authenticatedClient(required("EI_STAGING_SUPABASE_URL"), required("EI_STAGING_SUPABASE_ANON_KEY"));
    const anonymousRead = await anonymous.from("learning_evidence_artifact_links").select("id");
    expect(anonymousRead.error).not.toBeNull();
    const directWrite = await familyAClient.from("learning_evidence_artifact_links").insert({
      family_id: FAMILY_A,
      learner_id: LEARNER_A,
      evidence_entry_id: EVIDENCE_A[0],
      evidence_source_type: "work-sample",
      canonical_construct_id: "invented",
      learning_domain: "mathematics",
      construct_name: "Invented judgement",
      authority_id: "invented",
      framework_id: "invented",
      framework_version: "invented",
      curriculum_mapping_version: "invented",
      assigned_by_user_id: userA.id,
    });
    expect(directWrite.error).not.toBeNull();

    await expect(governStaffCaptureEvidence({
      client: service,
      actorUserId,
      request: { operation: "link-capture-evidence", familyId: FAMILY_B, learnerId: LEARNER_B, evidenceId: EVIDENCE_B, constructId: ADDITIVE, sourceType: "work-sample" },
    })).rejects.toMatchObject({ status: 403 });
    await expect(governStaffCaptureEvidence({
      client: service,
      actorUserId,
      request: { operation: "link-capture-evidence", familyId: FAMILY_A, learnerId: LEARNER_A, evidenceId: EVIDENCE_B, constructId: ADDITIVE, sourceType: "work-sample" },
    })).rejects.toMatchObject({ status: 403 });
    await expect(governStaffCaptureEvidence({
      client: service,
      actorUserId,
      request: { operation: "link-capture-evidence", familyId: FAMILY_A, learnerId: LEARNER_B, evidenceId: EVIDENCE_A[0], constructId: ADDITIVE, sourceType: "work-sample" },
    })).rejects.toMatchObject({ status: 403 });
    await expect(link(EVIDENCE_A[0], "MYL-MATH-AU-NUMERACY-V9::additive-strategies::P999", "work-sample")).rejects.toMatchObject({ status: 400 });
    expect(() => parseStaffCaptureEvidenceRequest({
      operation: "link-capture-evidence",
      familyId: FAMILY_A,
      learnerId: LEARNER_A,
      evidenceId: EVIDENCE_A[0],
      constructId: ADDITIVE,
      sourceType: "work-sample",
      developmentalStatus: "secure",
    })).toThrow(StaffCaptureLearningEvidenceError);

    const history = await loadStaffCaptureEvidenceHistory({ client: service, actorUserId, familyId: FAMILY_A, learnerId: LEARNER_A });
    expect(history.target).toEqual({ branchName: "intelligence-staging", projectRef: "owvxggviughmpursepof" });
    expect(history.timeline.some((event) => event.sourceLabel === "Initial assessment")).toBe(true);
    expect(history.timeline.some((event) => event.sourceLabel === "Recheck assessment")).toBe(true);
    expect(history.timeline.filter((event) => event.sourceLane === "authentic-capture").map((event) => event.sourceType)).toEqual(
      expect.arrayContaining(["work-sample", "parent-observation", "practical-observation"]),
    );
    expect(history.timeline.filter((event) => event.sourceLane === "authentic-capture").every((event) => event.assessmentInterpretation === null)).toBe(true);
    expect(history.timeline.map((event) => Date.parse(event.occurredAt))).toEqual(
      [...history.timeline.map((event) => Date.parse(event.occurredAt))].sort((left, right) => left - right),
    );

    const [rawAfter, resultsAfter, attemptsAfter, queueAfter] = await Promise.all([
      service.from("evidence_entries").select("*").in("id", [...EVIDENCE_A]),
      service.from("learning_evidence_results").select("id,canonical_content_hash,canonical_payload").eq("family_id", FAMILY_A).eq("learner_id", LEARNER_A).order("id"),
      service.from("learning_evidence_attempts").select("id,canonical_content_hash,evaluated_at").eq("family_id", FAMILY_A).eq("learner_id", LEARNER_A).order("id"),
      service.from("learning_plan_items").select("id,updated_at").eq("family_profile_id", FAMILY_A).eq("student_id", LEARNER_A).order("id"),
    ]);
    expect(rawAfter.data).toEqual(rawBefore);
    expect(resultsAfter.data).toEqual(resultsBefore);
    expect(attemptsAfter.data).toEqual(attemptsBefore);
    expect(queueAfter.data).toEqual(queueBefore);
    expect((rawAfter.data ?? []).every((row) => row.include_in_portfolio === false)).toBe(true);
  }, 120_000);
});
