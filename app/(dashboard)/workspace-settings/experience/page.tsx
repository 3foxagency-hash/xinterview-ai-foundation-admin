'use client';

import { ExperienceSection } from '@/components/customisation/experience-section';
import { WsSectionPage, WORKSPACE_SCOPE } from '@/components/workspace/ws-section-page';

export default function Page() {
  return (
    <WsSectionPage
      title="Interview experience"
      description="Instructions and integrity settings applied while a candidate records."
    >
      <ExperienceSection scopeId={WORKSPACE_SCOPE} />
    </WsSectionPage>
  );
}
