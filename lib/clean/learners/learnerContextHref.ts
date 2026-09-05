export const CANONICAL_LEARNER_CONTEXT_PARAM = "learner_id";

type LearnerContextParams = Record<string, string | null | undefined>;

/**
 * Adds the authenticated learner context to an internal href without
 * disturbing its existing query parameters or fragment.
 */
export function buildLearnerContextHref(
  href: string,
  learnerId: string | null | undefined,
  extraParams: LearnerContextParams = {},
) {
  const [pathAndQuery, hash] = href.split("#", 2);
  const [pathname, query = ""] = pathAndQuery.split("?", 2);
  const params = new URLSearchParams(query);

  for (const [key, value] of Object.entries(extraParams)) {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  const safeLearnerId = learnerId?.trim() ?? "";
  if (safeLearnerId) {
    params.delete("learnerId");
    params.set(CANONICAL_LEARNER_CONTEXT_PARAM, safeLearnerId);
  }

  const nextQuery = params.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
}
