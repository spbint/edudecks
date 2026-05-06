export type CleanReportExportFormat = "pdf" | "html" | "docx";

export type CleanReportExport = {
  id: string;
  reportId: string;
  familyId: string;
  learnerId: string;
  exportFormat: CleanReportExportFormat;
  exportedByUserId: string;
  createdAt: string | null;
};

export type CreateCleanReportExportInput = {
  reportId: string;
  learnerId: string;
  exportFormat?: CleanReportExportFormat;
};
