'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { getJob, type Job } from '@/lib/api/jobs';

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? null;
  const [job, setJob] = React.useState<Job | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!jobId) return;
    getJob(jobId)
      .then(setJob)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jobId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-h1 text-heading">
          {loading ? 'Loading…' : job?.title ?? 'Job'}
        </h1>
        <p className="mt-2 text-body text-muted">
          The full job detail view will be built next.
        </p>
      </div>
    </div>
  );
}
