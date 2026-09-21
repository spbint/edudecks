import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { FAMILY_EVIDENCE_STORAGE_BUCKET } from "@/lib/familyEvidence";
import {
  type FamilyMediaEvidenceRelationship,
  type FamilyMediaLifecycleStatus,
  type FamilyMediaManagerItem,
  type FamilyMediaManagerPayload,
  type FamilyMediaRemovalRepository,
  type FamilyMediaRemovalTarget,
} from "@/lib/clean/media/mediaManager";

type MediaAssetRow = {
  id?: unknown;
  family_id?: unknown;
  learner_id?: unknown;
  evidence_entry_id?: unknown;
  academic_year_id?: unknown;
  object_path?: unknown;
  byte_size?: unknown;
  mime_type?: unknown;
  uploaded_at?: unknown;
  lifecycle_status?: unknown;
};

type EvidenceRow = {
  id?: unknown;
  family_id?: unknown;
  learner_id?: unknown;
  title?: unknown;
  what_happened?: unknown;
  observed_on?: unknown;
  attachment_urls?: unknown;
  image_url?: unknown;
  file_url?: unknown;
  audio_url?: unknown;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function nullable(value: unknown) {
  return clean(value) || null;
}

function bytes(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function mediaKind(mimeType: string): FamilyMediaManagerItem["mediaKind"] {
  if (mimeType.toLowerCase().startsWith("image/")) return "image";
  if (mimeType.toLowerCase().startsWith("audio/")) return "audio";
  return "file";
}

function lifecycle(value: unknown): FamilyMediaLifecycleStatus {
  const normalized = clean(value);
  if (normalized === "grace" || normalized === "purge_pending" || normalized === "purged") {
    return normalized;
  }
  return "active";
}

function flattenReferences(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return [value];
}

function referencePath(value: unknown): string | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return nullable(record.path) || nullable(record.storagePath) || nullable(record.objectPath);
  }
  const raw = clean(value);
  if (!raw) return null;
  if (raw.startsWith("{")) {
    try {
      return referencePath(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  return raw;
}

function evidenceReferencesPath(row: EvidenceRow, objectPath: string) {
  return [
    row.image_url,
    row.file_url,
    row.audio_url,
    ...flattenReferences(row.attachment_urls),
  ].some((value) => referencePath(value) === objectPath);
}

export function createMediaManagerAdminClient() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = clean(
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY,
  );
  if (!url || !serviceKey) {
    throw new Error("Server media management requires Supabase service-role configuration.");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function createSupabaseFamilyMediaRemovalRepository(input: {
  authenticatedClient: SupabaseClient;
  adminClient: SupabaseClient;
}): FamilyMediaRemovalRepository {
  const { authenticatedClient, adminClient } = input;
  return {
    async isFamilyMember({ familyId, userId }) {
      const response = await authenticatedClient
        .from("family_members")
        .select("id")
        .eq("family_id", familyId)
        .eq("user_id", userId)
        .maybeSingle();
      if (response.error) throw response.error;
      return Boolean(response.data?.id);
    },
    async findRemovalTarget({ familyId, assetId }) {
      const response = await adminClient
        .from("family_media_assets")
        .select("id,family_id,learner_id,evidence_entry_id,academic_year_id,object_path,byte_size,lifecycle_status")
        .eq("family_id", familyId)
        .eq("id", assetId)
        .maybeSingle();
      if (response.error) throw response.error;
      if (!response.data) return null;
      const row = response.data as MediaAssetRow;
      return {
        assetId: clean(row.id),
        familyId: clean(row.family_id),
        learnerId: nullable(row.learner_id),
        evidenceEntryId: nullable(row.evidence_entry_id),
        academicYearId: nullable(row.academic_year_id),
        objectPath: clean(row.object_path),
        byteSize: bytes(row.byte_size),
        lifecycleStatus: lifecycle(row.lifecycle_status),
      } satisfies FamilyMediaRemovalTarget;
    },
    async findEvidenceRelationship({ familyId, evidenceEntryId }) {
      const response = await adminClient
        .from("evidence_entries")
        .select("id,family_id,learner_id")
        .eq("family_id", familyId)
        .eq("id", evidenceEntryId)
        .maybeSingle();
      if (response.error) throw response.error;
      if (!response.data) return null;
      return {
        id: clean(response.data.id),
        familyId: clean(response.data.family_id),
        learnerId: nullable(response.data.learner_id),
      } satisfies FamilyMediaEvidenceRelationship;
    },
    async removeStorageObject(objectPath) {
      const response = await adminClient.storage
        .from(FAMILY_EVIDENCE_STORAGE_BUCKET)
        .remove([objectPath]);
      if (response.error) throw response.error;
    },
    async getLifecycleStatus(assetId) {
      const response = await adminClient
        .from("family_media_assets")
        .select("lifecycle_status")
        .eq("id", assetId)
        .maybeSingle();
      if (response.error) throw response.error;
      return response.data ? lifecycle(response.data.lifecycle_status) : null;
    },
    async evidenceStillReferencesPath({ familyId, evidenceEntryId, objectPath }) {
      const response = await adminClient
        .from("evidence_entries")
        .select("attachment_urls,image_url,file_url,audio_url")
        .eq("family_id", familyId)
        .eq("id", evidenceEntryId)
        .maybeSingle();
      if (response.error) throw response.error;
      return response.data ? evidenceReferencesPath(response.data as EvidenceRow, objectPath) : false;
    },
  };
}

export async function loadFamilyMediaManager(input: {
  familyId: string;
  userId: string;
  authenticatedClient: SupabaseClient;
  adminClient: SupabaseClient;
}): Promise<FamilyMediaManagerPayload> {
  const membership = await input.authenticatedClient
    .from("family_members")
    .select("id")
    .eq("family_id", input.familyId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (membership.error) throw membership.error;
  if (!membership.data) throw new Error("family_media_forbidden");

  const [assetResponse, learnerResponse, yearResponse] = await Promise.all([
    input.adminClient
      .from("family_media_assets")
      .select("id,family_id,learner_id,evidence_entry_id,academic_year_id,object_path,byte_size,mime_type,uploaded_at,lifecycle_status")
      .eq("family_id", input.familyId)
      .in("lifecycle_status", ["active", "grace", "purge_pending"])
      .order("byte_size", { ascending: false }),
    input.adminClient
      .from("learners")
      .select("id,first_name,preferred_name")
      .eq("family_id", input.familyId),
    input.adminClient
      .from("academic_years")
      .select("id,title")
      .eq("family_id", input.familyId),
  ]);
  if (assetResponse.error) throw assetResponse.error;
  if (learnerResponse.error) throw learnerResponse.error;
  if (yearResponse.error) throw yearResponse.error;

  const assets = (assetResponse.data ?? []) as MediaAssetRow[];
  const evidenceIds = [...new Set(assets.map((asset) => clean(asset.evidence_entry_id)).filter(Boolean))];
  const [evidenceResponse, linkResponse] = evidenceIds.length
    ? await Promise.all([
        input.adminClient
          .from("evidence_entries")
          .select("id,family_id,learner_id,title,what_happened,observed_on")
          .eq("family_id", input.familyId)
          .in("id", evidenceIds),
        input.adminClient
          .from("evidence_entry_learner_links")
          .select("evidence_entry_id,learner_id")
          .eq("family_id", input.familyId)
          .in("evidence_entry_id", evidenceIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (evidenceResponse.error) throw evidenceResponse.error;
  if (linkResponse.error) throw linkResponse.error;

  const evidenceById = new Map(
    ((evidenceResponse.data ?? []) as EvidenceRow[]).map((row) => [clean(row.id), row]),
  );
  const learnerLabels = new Map(
    (learnerResponse.data ?? []).map((row) => [
      clean(row.id),
      clean(row.preferred_name) || clean(row.first_name) || "Learner",
    ]),
  );
  const yearLabels = new Map(
    (yearResponse.data ?? []).map((row) => [clean(row.id), clean(row.title) || "Learning year"]),
  );
  const participantIds = new Map<string, string[]>();
  for (const row of linkResponse.data ?? []) {
    const evidenceEntryId = clean(row.evidence_entry_id);
    const learnerId = clean(row.learner_id);
    if (!evidenceEntryId || !learnerId) continue;
    participantIds.set(evidenceEntryId, [...new Set([...(participantIds.get(evidenceEntryId) ?? []), learnerId])]);
  }

  const items = (
    await Promise.all(
      assets.map(async (asset): Promise<FamilyMediaManagerItem | null> => {
        const evidenceEntryId = clean(asset.evidence_entry_id);
        const evidence = evidenceById.get(evidenceEntryId);
        const objectPath = clean(asset.object_path);
        if (!evidence || !objectPath) return null;

        const primaryLearnerId = clean(evidence.learner_id) || clean(asset.learner_id);
        const allLearnerIds = [...new Set([primaryLearnerId, ...(participantIds.get(evidenceEntryId) ?? [])].filter(Boolean))];
        const signed = await input.adminClient.storage
          .from(FAMILY_EVIDENCE_STORAGE_BUCKET)
          .createSignedUrl(objectPath, 10 * 60);
        const mimeType = clean(asset.mime_type) || "application/octet-stream";
        const academicYearId = nullable(asset.academic_year_id);
        const description = clean(evidence.what_happened);

        return {
          assetId: clean(asset.id),
          academicYearId,
          learningYearLabel: academicYearId ? yearLabels.get(academicYearId) || "Learning year" : "Earlier learning year",
          byteSize: bytes(asset.byte_size),
          mimeType,
          mediaKind: mediaKind(mimeType),
          previewUrl: signed.error ? null : nullable(signed.data?.signedUrl),
          previewAvailable: !signed.error && Boolean(signed.data?.signedUrl),
          learnerIds: allLearnerIds,
          learnerLabels: allLearnerIds.map((id) => learnerLabels.get(id) || "Learner"),
          evidenceTitle: clean(evidence.title) || description.slice(0, 80) || "Learning record",
          evidenceDescription: description || null,
          observedOn: clean(evidence.observed_on),
          uploadedAt: nullable(asset.uploaded_at),
        };
      }),
    )
  ).filter((item): item is FamilyMediaManagerItem => Boolean(item));

  return {
    items,
    learnerOptions: [...learnerLabels.entries()].map(([id, label]) => ({ id, label })),
    learningYearOptions: [...yearLabels.entries()].map(([id, label]) => ({ id, label })),
  };
}
