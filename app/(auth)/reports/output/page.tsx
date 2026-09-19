import { redirect } from "next/navigation";

import {
  buildLegacyReportRedirectPath,
  type LegacyReportSearchParams,
} from "../legacyReportRedirect";

export default async function LegacyReportOutputPage({
  searchParams,
}: {
  searchParams: Promise<LegacyReportSearchParams>;
}) {
  redirect(buildLegacyReportRedirectPath(await searchParams));
}
