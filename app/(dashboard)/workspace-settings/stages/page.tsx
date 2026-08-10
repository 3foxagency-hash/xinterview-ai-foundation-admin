'use client';

import { StagesSection } from '@/components/customisation/stages-section';
import { WsSectionPage, WORKSPACE_SCOPE } from '@/components/workspace/ws-section-page';

export default function Page() {
  return (
    <WsSectionPage
      title="Stages"
      description="The pipeline every candidate moves through in this workspace."
    >
      <StagesSection scopeId={WORKSPACE_SCOPE} />
    </WsSectionPage>
  );
}
