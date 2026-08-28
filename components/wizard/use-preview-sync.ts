'use client';

import * as React from 'react';
import { useOptionalCustomisationPreview, type CustomisationPreviewState } from '@/components/wizard/customisation-preview-context';

/**
 * Pushes a section's live form data into the customisation preview context
 * whenever it changes, so the preview panel re-renders in real time.
 *
 * Uses the optional hook so sections work unchanged in Workspace settings
 * where there is no preview context.
 */
export function usePreviewSync<K extends keyof CustomisationPreviewState>(
  key: K,
  data: NonNullable<CustomisationPreviewState[K]> | null | undefined
) {
  const ctx = useOptionalCustomisationPreview();
  React.useEffect(() => {
    if (!ctx || !data) return;
    ctx.setSectionData(key, data);
  }, [ctx, key, data]);
}
