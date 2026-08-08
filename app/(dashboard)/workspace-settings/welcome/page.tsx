'use client';

import { WelcomeSection } from '@/components/customisation/welcome-section';
import { WsSectionPage, WORKSPACE_SCOPE } from '@/components/workspace/ws-section-page';

export default function Page() {
  return (
    <WsSectionPage
      title="Welcome page"
      description="The first thing candidates see when they open an interview link."
    >
      <WelcomeSection scopeId={WORKSPACE_SCOPE} />
    </WsSectionPage>
  );
}
