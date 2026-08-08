'use client';

import { SocialSection } from '@/components/customisation/social-section';
import { WsSectionPage, WORKSPACE_SCOPE } from '@/components/workspace/ws-section-page';

export default function Page() {
  return (
    <WsSectionPage
      title="Social preview"
      description="How interview links look when shared."
    >
      <SocialSection scopeId={WORKSPACE_SCOPE} />
    </WsSectionPage>
  );
}
