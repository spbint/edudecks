import { getCurrentCleanUserId, normalizeCleanErrorMessage } from "@/lib/clean/family/client";
import { supabase } from "@/lib/supabaseClient";

export type FamilyResourceType = "web_link" | "reference" | "file";

export type FamilyResource = {
  id: string;
  familyId: string;
  resourceType: FamilyResourceType;
  name: string;
  url: string | null;
  referenceText: string | null;
  note: string | null;
  resourceFileId: string | null;
  resourceFileName: string | null;
  resourceFilePath: string | null;
  byteSize: number | null;
};

const RESOURCE_SELECT = "id,family_id,resource_type,name,url,reference_text,note,resource_file_id,created_at,resource_file:family_resource_files(original_filename,object_path,byte_size,status)";

function clean(value: unknown) { return String(value ?? "").trim(); }

function normalizeType(value: unknown): FamilyResourceType {
  return clean(value) === "file" ? "file" : clean(value) === "web_link" ? "web_link" : "reference";
}

function toFamilyResource(row: Record<string, unknown>): FamilyResource {
  const file = (row.resource_file as Record<string, unknown> | null) ?? null;
  return {
    id: clean(row.id), familyId: clean(row.family_id), resourceType: normalizeType(row.resource_type),
    name: clean(row.name), url: clean(row.url) || null, referenceText: clean(row.reference_text) || null,
    note: clean(row.note) || null, resourceFileId: clean(row.resource_file_id) || null,
    resourceFileName: clean(file?.original_filename) || null, resourceFilePath: clean(file?.object_path) || null,
    byteSize: Number.isFinite(Number(file?.byte_size)) ? Number(file?.byte_size) : null,
  };
}

function resourceError(error: unknown, fallback: string) {
  return new Error(normalizeCleanErrorMessage(error, fallback));
}

export async function listFamilyResources(familyId: string, options?: { search?: string; type?: FamilyResourceType | "all" }) {
  let query = supabase.from("family_resources").select(RESOURCE_SELECT).eq("family_id", familyId).order("name", { ascending: true });
  if (options?.type && options.type !== "all") query = query.eq("resource_type", options.type);
  const response = await query;
  if (response.error) throw resourceError(response.error, "We could not load your Resource Cupboard.");
  const search = clean(options?.search).toLowerCase();
  return ((response.data ?? []) as unknown as Array<Record<string, unknown>>)
    .map(toFamilyResource)
    .filter((resource) => !search || `${resource.name} ${resource.url ?? ""} ${resource.referenceText ?? ""} ${resource.note ?? ""}`.toLowerCase().includes(search));
}

export async function createFamilyResource(input: {
  familyId: string;
  resourceType: "web_link" | "reference";
  name: string;
  url?: string | null;
  referenceText?: string | null;
  note?: string | null;
}) {
  const userId = await getCurrentCleanUserId();
  if (!userId) throw new Error("You need to sign in before adding a resource.");
  const name = clean(input.name);
  const url = clean(input.url) || null;
  const referenceText = clean(input.referenceText) || null;
  if (!name) throw new Error("Add a resource name.");
  if (input.resourceType === "web_link" && !/^https?:\/\/[^\s]+$/i.test(url ?? "")) throw new Error("Use a web link starting with http:// or https://.");
  if (input.resourceType === "reference" && !referenceText) throw new Error("Add the book, curriculum or reference details.");
  const response = await supabase.from("family_resources").insert({
    family_id: input.familyId, resource_type: input.resourceType, name,
    url: input.resourceType === "web_link" ? url : null,
    reference_text: input.resourceType === "reference" ? referenceText : null,
    note: clean(input.note) || null, created_by_user_id: userId,
  }).select(RESOURCE_SELECT).single();
  if (response.error) throw resourceError(response.error, "We could not add this resource.");
  return toFamilyResource(response.data as unknown as Record<string, unknown>);
}

export async function attachFamilyResourceToCustomLearning(input: { familyId: string; customLearningItemId: string; resource: FamilyResource }) {
  const userId = await getCurrentCleanUserId();
  if (!userId) throw new Error("You need to sign in before using a resource.");
  const response = await supabase.from("custom_learning_resources").insert({
    family_id: input.familyId, custom_learning_item_id: input.customLearningItemId,
    family_resource_id: input.resource.id, resource_type: input.resource.resourceType,
    label: null, url: null, reference_text: null, resource_file_id: null, created_by_user_id: userId,
  }).select("id,resource_type,label,url,reference_text,resource_file_id,family_resource_id,position").single();
  if (response.error) throw resourceError(response.error, "We could not use this resource here.");
  return response.data;
}

export async function createUploadedPdfFamilyResource(input: { familyId: string; resourceFileId: string; name: string; note?: string | null }) {
  const userId = await getCurrentCleanUserId();
  if (!userId) throw new Error("You need to sign in before adding a resource.");
  const response = await supabase.from("family_resources").insert({
    family_id: input.familyId, resource_type: "file", name: clean(input.name),
    resource_file_id: input.resourceFileId, note: clean(input.note) || null, created_by_user_id: userId,
  }).select(RESOURCE_SELECT).single();
  if (response.error) throw resourceError(response.error, "We could not save this PDF to your Resource Cupboard.");
  return toFamilyResource(response.data as unknown as Record<string, unknown>);
}

export async function removeFamilyResource(familyId: string, resourceId: string) {
  const response = await supabase.from("family_resources").delete().eq("family_id", familyId).eq("id", resourceId);
  if (response.error) throw resourceError(response.error, "This resource is still used by learning items, so it was kept.");
}

export function familyResourceTypeLabel(type: FamilyResourceType) {
  return type === "web_link" ? "Website" : type === "file" ? "PDF" : "Book / curriculum / reference";
}
