import { Users } from 'lucide-react';
import { PagePlaceholder } from '@/components/sidebar/page-placeholder';

export default function CandidatesPage() {
  return (
    <PagePlaceholder
      title="Candidates"
      icon={Users}
      description="Review and compare everyone who has interviewed. Coming soon."
    />
  );
}
