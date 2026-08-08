'use client';

import { BrandingSection } from '@/components/customisation/branding-section';
import { WsSectionPage, WORKSPACE_SCOPE } from '@/components/workspace/ws-section-page';

export default function Page() {
  return (
    <WsSectionPage
      title="Branding"
      description="Your logo, colours, theme and font on every candidate-facing page."
    >
      <BrandingSection scopeId={WORKSPACE_SCOPE} />
    </WsSectionPage>
  );
}
