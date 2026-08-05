export const features = {
  companyDeletion: false,
  inviteWithRole: true,
  editableRoles: true,
  customStages: false,
} as const;

export type FeatureFlags = typeof features;
export type FeatureKey = keyof FeatureFlags;
