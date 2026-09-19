export type LegacyReportSearchParams = Record<
  string,
  string | string[] | undefined
>;

function firstUsableValue(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : [value];
  return values.find((entry) => typeof entry === "string" && entry.trim())?.trim() || "";
}

export function buildLegacyReportRedirectPath(
  searchParams: LegacyReportSearchParams,
) {
  const learnerId =
    firstUsableValue(searchParams.learner_id) ||
    firstUsableValue(searchParams.learnerId);

  return learnerId
    ? `/my-reports?learner_id=${encodeURIComponent(learnerId)}`
    : "/my-reports";
}
