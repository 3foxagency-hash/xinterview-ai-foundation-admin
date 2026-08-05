import { Home } from 'lucide-react';
import { PagePlaceholder } from '@/components/sidebar/page-placeholder';

export default function OverviewPage() {
  return (
    <PagePlaceholder
      title="Overview"
      icon={Home}
      description="Your hiring dashboard is coming soon."
      showBackLink={false}
    />
  );
}
