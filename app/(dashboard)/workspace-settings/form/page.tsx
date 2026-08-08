'use client';

import { FormSection } from '@/components/customisation/form-section';
import { WsSectionPage, WORKSPACE_SCOPE } from '@/components/workspace/ws-section-page';

export default function Page() {
  return (
    <WsSectionPage
      title="Form settings"
      description="What candidates are asked for before the interview starts."
    >
      <FormSection scopeId={WORKSPACE_SCOPE} />
    </WsSectionPage>
  );
}
