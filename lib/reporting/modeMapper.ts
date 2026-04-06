import { ReportMode } from "@/lib/reportDrafts";
import { ReportingMode } from "@/lib/reporting/intelligence";

export function mapReportModeToReportingMode(mode?: ReportMode): ReportingMode {
  const safeMode = (mode || "").toLowerCase();
  if (safeMode === "authority-ready") {
    return "authority_ready_concise";
  }
  if (safeMode === "progress-review") {
    return "teacher_professional";
  }
  return "parent_friendly";
}
