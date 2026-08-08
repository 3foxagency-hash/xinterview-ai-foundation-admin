'use client';

import { ThankYouSection } from '@/components/customisation/thank-you-section';
import { WsSectionPage, WORKSPACE_SCOPE } from '@/components/workspace/ws-section-page';

export default function Page() {
  return (
    <WsSectionPage
      title="Thank you page"
      description="Shown after a candidate submits their interview."
    >
      <ThankYouSection scopeId={WORKSPACE_SCOPE} />
    </WsSectionPage>
  );
}
