import { getCurrentUserId } from "@/lib/familySettings";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

export function safeFamilyValue(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

export function isMissingLearnerColumnError(error: unknown) {
  const message = String(
    (error as { message?: unknown })?.message ?? "",
  ).toLowerCase();
  return message.includes("does not exist") && message.includes("column");
}

export function isMissingLearnerRelationOrColumn(error: unknown) {
  const message = String(
    (error as { message?: unknown })?.message ?? "",
  ).toLowerCase();
  return (
    message.includes("does not exist") &&
    (message.includes("column") || message.includes("relation"))
  );
}

export function orderLearnerRowsByIds<T extends { id?: unknown }>(
  rows: T[],
  orderedIds: string[],
) {
  const rowMap = new Map(
    rows.map((row) => [safeFamilyValue(row.id), row] as const),
  );

  return orderedIds
    .map((id) => rowMap.get(id) ?? null)
    .filter((row): row is T => row !== null);
}

export async function loadLinkedFamilyStudentIds(): Promise<string[] | null> {
  if (!hasSupabaseEnv) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const linksResp = await supabase
    .from("parent_student_links")
    .select("student_id,sort_order,created_at")
    .eq("parent_user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (linksResp.error) {
    if (!isMissingLearnerRelationOrColumn(linksResp.error)) {
      throw linksResp.error;
    }
    return null;
  }

  const orderedIds: string[] = [];
  const seen = new Set<string>();

  ((linksResp.data ?? []) as Array<{ student_id?: string | null }>).forEach((row) => {
    const id = safeFamilyValue(row.student_id);
    if (!id || seen.has(id)) return;
    seen.add(id);
    orderedIds.push(id);
  });

  return orderedIds;
}

export async function loadFamilyStudentsWithVariants<T>(
  selectVariants: string[],
  options?: {
    orderedIds?: string[] | null;
    orderByCreatedAt?: boolean;
  },
): Promise<T[]> {
  const orderedIds = options?.orderedIds ?? null;
  const shouldOrderByCreatedAt = options?.orderByCreatedAt !== false;

  if (Array.isArray(orderedIds) && orderedIds.length === 0) {
    return [];
  }

  let lastError: unknown = null;

  for (const select of selectVariants) {
    let query = supabase.from("students").select(select);

    if (Array.isArray(orderedIds)) {
      query = query.in("id", orderedIds);
    }

    if (shouldOrderByCreatedAt) {
      query = query.order("created_at", { ascending: true });
    }

    const response = await query;
    if (!response.error) {
      const rows = ((response.data ?? []) as unknown) as T[];
      return Array.isArray(orderedIds)
        ? orderLearnerRowsByIds(rows as Array<{ id?: unknown }>, orderedIds) as T[]
        : rows;
    }

    lastError = response.error;
    if (!isMissingLearnerRelationOrColumn(response.error)) {
      throw response.error;
    }
  }

  if (lastError) throw lastError;
  return [];
}
