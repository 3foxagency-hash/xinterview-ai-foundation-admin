import { Calendar } from 'lucide-react';
import { PagePlaceholder } from '@/components/sidebar/page-placeholder';

export default function WhatsNewPage() {
  return (
    <PagePlaceholder
      title="What's new"
      icon={Calendar}
      description="Product updates and release notes. Coming soon."
    />
  );
}
