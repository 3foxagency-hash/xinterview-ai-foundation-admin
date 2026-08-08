'use client';

import { ScoringSection } from '@/components/customisation/scoring-section';
import { WsSectionPage, WORKSPACE_SCOPE } from '@/components/workspace/ws-section-page';

export default function Page() {
  return (
    <WsSectionPage
      title="Scoring labels"
      description="What each score band is called when reviewers read a result."
    >
      <ScoringSection scopeId={WORKSPACE_SCOPE} />
    </WsSectionPage>
  );
}
