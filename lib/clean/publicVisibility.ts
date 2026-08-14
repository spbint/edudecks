export type PublicProductVisibility = {
  pathways: boolean;
  assessments: boolean;
};

/**
 * Public discovery switches only. Private routes and their underlying
 * workspace, assessment, and progress logic remain available when disabled.
 */
export const PUBLIC_PATHWAYS_ENABLED = false;
export const PUBLIC_ASSESSMENTS_ENABLED = false;

export const publicProductVisibility: PublicProductVisibility = {
  pathways: PUBLIC_PATHWAYS_ENABLED,
  assessments: PUBLIC_ASSESSMENTS_ENABLED,
};
