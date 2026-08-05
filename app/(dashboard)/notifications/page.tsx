import { Bell } from 'lucide-react';
import { PagePlaceholder } from '@/components/sidebar/page-placeholder';

export default function NotificationsPage() {
  return (
    <PagePlaceholder
      title="Notifications"
      icon={Bell}
      description="Your alerts and activity feed. Coming soon."
    />
  );
}
