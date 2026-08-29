/**
 * The only 8 colours a scoring band can take. Anchored on the four AI match
 * tones used on the job page (Perfect/Good/Average/Poor — success green,
 * info blue, warning amber, neutral grey), plus four more hues distinct
 * enough to stay tellable apart as solid badge fills in both light and dark
 * admin themes, for workspaces that define more than four bands.
 *
 * Single source of truth: the scoring section's colour picker and the
 * mock data's default bands both read from this list, so a freshly loaded
 * workspace's Poor/Fair/Good bands are never an off-palette shade that the
 * picker itself wouldn't offer.
 */
export const SCORING_BAND_COLOURS = [
  '#059669', // Perfect / Good — success (the only green in the set)
  '#0284C7', // Good / Fair — info
  '#D97706', // Average / Fair — warning
  '#6B7280', // Poor — neutral
  '#DC2626', // red
  '#8B5CF6', // purple
  '#4F46E5', // indigo
  '#DB2777', // pink
] as const;
