import { Briefcase } from 'lucide-react';
import { PagePlaceholder } from '@/components/sidebar/page-placeholder';

export default function JobsPage() {
  return (
    <PagePlaceholder
      title="Jobs"
      icon={Briefcase}
      description="Manage your open roles and interview pipelines here. Coming soon."
    />
  );
}
