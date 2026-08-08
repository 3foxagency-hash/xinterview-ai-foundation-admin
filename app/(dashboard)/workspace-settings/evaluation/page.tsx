'use client';

import { EvaluationSection } from '@/components/customisation/evaluation-section';
import { WsSectionPage, WORKSPACE_SCOPE } from '@/components/workspace/ws-section-page';

export default function Page() {
  return (
    <WsSectionPage
      title="AI evaluation"
      description="Scoring criteria and weighting applied before a human reviews."
    >
      <EvaluationSection scopeId={WORKSPACE_SCOPE} />
    </WsSectionPage>
  );
}
