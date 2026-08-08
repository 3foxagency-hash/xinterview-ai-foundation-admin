'use client';

import { NotificationsSection } from '@/components/customisation/notifications-section';
import { WsSectionPage, WORKSPACE_SCOPE } from '@/components/workspace/ws-section-page';

export default function Page() {
  return (
    <WsSectionPage
      title="Emails & notifications"
      description="Which messages go out automatically during an interview."
    >
      <NotificationsSection scopeId={WORKSPACE_SCOPE} />
    </WsSectionPage>
  );
}
