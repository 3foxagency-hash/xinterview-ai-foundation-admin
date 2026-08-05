import { BookOpen } from 'lucide-react';
import { PagePlaceholder } from '@/components/sidebar/page-placeholder';

export default function DocumentationPage() {
  return (
    <PagePlaceholder
      title="Documentation"
      icon={BookOpen}
      description="Guides and API reference for XInterview. Coming soon."
    />
  );
}
