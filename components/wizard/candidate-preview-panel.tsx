'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { getBranding, getWelcomePage } from '@/lib/api/jobs';
import type { BrandingInput, WelcomePageInput } from '@/lib/validation/job';
import {
  CandidatePreview,
  type PreviewBrandingData,
  type PreviewWelcomeData,
} from '@/components/wizard/candidate-preview';

/**
 * Loads branding + welcome data for the current job and feeds it into
 * <CandidatePreview>, re-fetching whenever the route changes.
 */
export function CandidatePreviewPanel({ jobTitle }: { jobTitle?: string }) {
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? null;
  const [branding, setBranding] = React.useState<PreviewBrandingData | null>(null);
  const [welcome, setWelcome] = React.useState<PreviewWelcomeData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    Promise.all([getBranding(jobId), getWelcomePage(jobId)])
      .then(([b, w]) => {
        setBranding({
          logoUrl: (b as BrandingInput).logoUrl ?? '',
          companyTitle: (b as BrandingInput).companyTitle ?? '',
          primaryColour: (b as BrandingInput).primaryColour ?? '#5B4FE9',
          secondaryColour: (b as BrandingInput).secondaryColour ?? '#1F242E',
          theme: (b as BrandingInput).theme ?? 'light',
          font: (b as BrandingInput).font ?? 'inter',
          modernInterface: (b as BrandingInput).modernInterface ?? false,
        });
        setWelcome({
          headline: (w as WelcomePageInput).headline ?? 'Welcome to your interview',
          subtitle: (w as WelcomePageInput).subtitle ?? "We're excited to learn more about you",
          estimatedTime: (w as WelcomePageInput).estimatedTime ?? 15,
          introVideoEnabled: (w as WelcomePageInput).introVideoEnabled ?? false,
          introVideoUrl: (w as WelcomePageInput).introVideoUrl ?? '',
          introNoteEnabled: (w as WelcomePageInput).introNoteEnabled ?? false,
          introNoteTitle: (w as WelcomePageInput).introNoteTitle ?? '',
          introNoteBody: (w as WelcomePageInput).introNoteBody ?? '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading || !branding || !welcome) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return <CandidatePreview branding={branding} welcome={welcome} jobTitle={jobTitle} />;
}
