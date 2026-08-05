import { FileText } from 'lucide-react';
import { PagePlaceholder } from '@/components/sidebar/page-placeholder';

export default function ReportsPage() {
  return (
    <PagePlaceholder
      title="Reports"
      icon={FileText}
      description="Hiring funnel and interview analytics. Coming soon."
    />
  );
}
