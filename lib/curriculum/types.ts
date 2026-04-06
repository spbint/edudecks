export type FrameworkType =
  | "national"
  | "state"
  | "regional"
  | "international";

export type SubjectScope =
  | "ela-literacy"
  | "mathematics"
  | "science"
  | "humanities"
  | "general";

export type LevelType = "grade" | "band" | "course";

export type RelationshipType =
  | "aligns-with"
  | "supplements"
  | "extends"
  | "counterpart"
  | "anchor-to-grade"
  | "parent-child";

export type MappingOrigin = "manual" | "suggested" | "ai-inferred" | "imported";

export type CurriculumCountry = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type CurriculumRegion = {
  id: string;
  country_id: string;
  code: string;
  name: string;
  region_type: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type CurriculumFramework = {
  id: string;
  country_id: string;
  region_id?: string | null;
  code: string;
  name: string;
  framework_type: FrameworkType;
  subject_scope: SubjectScope;
  official_source_url?: string | null;
  version_label?: string | null;
  is_active: boolean;
  created_at: string;
};

export type CurriculumSubject = {
  id: string;
  framework_id: string;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CurriculumLevel = {
  id: string;
  framework_id: string;
  official_level_label: string;
  normalized_level_label: string;
  normalized_sort_order: number;
  level_type: LevelType;
  is_band: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CurriculumStrand = {
  id: string;
  framework_id: string;
  subject_id?: string | null;
  parent_strand_id?: string | null;
  code: string;
  name: string;
  description?: string | null;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CurriculumStandard = {
  id: string;
  framework_id: string;
  subject_id?: string | null;
  strand_id?: string | null;
  parent_standard_id?: string | null;
  level_id?: string | null;
  official_code: string;
  short_code?: string | null;
  title?: string | null;
  description: string;
  official_grade_label?: string | null;
  normalized_grade_label?: string | null;
  normalized_grade_sort?: number | null;
  discipline_context?: string | null;
  source_order?: number | null;
  is_anchor: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CurriculumStandardRelationship = {
  id: string;
  framework_id: string;
  source_standard_id: string;
  target_standard_id: string;
  relationship_type: RelationshipType;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CurriculumCrosswalk = {
  id: string;
  source_framework_id: string;
  target_framework_id: string;
  source_standard_id: string;
  target_standard_id: string;
  relationship_type: RelationshipType;
  confidence_score?: number | null;
  notes?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type EvidenceCurriculumLink = {
  id: string;
  evidence_id: string;
  curriculum_standard_id: string;
  mapping_origin: MappingOrigin;
  confidence?: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AssessmentCurriculumLink = {
  id: string;
  assessment_id: string;
  curriculum_standard_id: string;
  mapping_origin: MappingOrigin;
  confidence?: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ReportCurriculumLink = {
  id: string;
  report_id: string;
  curriculum_standard_id: string;
  mapping_origin: MappingOrigin;
  confidence?: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
