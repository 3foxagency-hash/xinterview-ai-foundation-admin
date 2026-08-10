export const features = {
  companyDeletion: false,
  // Invites always go out as Member; the role is set afterwards from the
  // roster, so the invite modal doesn't ask for it.
  inviteWithRole: false,
  editableRoles: true,
  // Stages are editable: 4 system stages stay locked, the rest can be
  // renamed, reordered and removed. Matches the live product.
  customStages: true,
} as const;

export type FeatureFlags = typeof features;
export type FeatureKey = keyof FeatureFlags;
