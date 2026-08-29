'use client';

import { IntroNoteSection } from '@/components/customisation/intro-note-section';
import { WsSectionPage, WORKSPACE_SCOPE } from '@/components/workspace/ws-section-page';

export default function Page() {
  return (
    <WsSectionPage
      title="Intro note"
      description="A note candidates must acknowledge before they start their interview."
    >
      <IntroNoteSection scopeId={WORKSPACE_SCOPE} />
    </WsSectionPage>
  );
}
