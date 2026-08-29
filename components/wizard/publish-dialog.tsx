'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TriangleAlert as AlertTriangle, CircleAlert as AlertCircle, Loader as Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { publishJob } from '@/lib/api/jobs';
import { sendQueuedInvites, updateLinkSettings } from '@/lib/api/invites';
import { track } from '@/lib/utils/analytics';
import { toast } from 'sonner';
import type { InterviewFormat } from '@/lib/validation/job';
import { INTERVIEW_FORMAT_CONFIG } from '@/lib/constants/interview-formats';

export interface PublishSummaryData {
  jobId: string;
  title: string;
  format: InterviewFormat;
  questionCount: number;
  estimatedMinutes: number;
  interviewDuration: number;
  teamSize: number;
  inviteCount: number;
}

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PublishSummaryData | null;
  onPublished: () => void;
}

function formatLabel(format: InterviewFormat): string {
  return INTERVIEW_FORMAT_CONFIG.find((f) => f.id === format)?.name ?? format;
}

export function PublishDialog({ open, onOpenChange, data, onPublished }: PublishDialogProps) {
  const router = useRouter();
  const [publishing, setPublishing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setError(null);
      track('job_publish_opened', {});
    }
  }, [open]);

  if (!data) return null;

  const warnings: { text: string; href: string }[] = [];
  if (data.teamSize <= 1) {
    warnings.push({ text: 'No one else is assigned to this job', href: `/jobs/${data.jobId}/edit/teams` });
  }
  if (data.inviteCount === 0) {
    warnings.push({ text: 'No candidates invited yet', href: `/jobs/${data.jobId}/edit/invite` });
  }
  if (data.estimatedMinutes > data.interviewDuration) {
    warnings.push({
      text: `Estimated interview time (${data.estimatedMinutes} min) is longer than the set duration (${data.interviewDuration} min)`,
      href: `/jobs/${data.jobId}/edit/questions`,
    });
  }

  // Nothing on this step is required to publish (§10) — there are no true
  // blockers from Step 5 itself, but the shape exists so a future required
  // check (e.g. job details incomplete) has somewhere to attach without a
  // rewrite of this dialog.
  const blockers: { text: string; href: string }[] = [];
  const canPublish = blockers.length === 0;

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      await publishJob(data.jobId);
      await updateLinkSettings(data.jobId, { active: true });
      const sentCount = await sendQueuedInvites(data.jobId);
      track('job_published', { inviteCount: data.inviteCount, methods: ['link', 'email', 'bulk', 'ats'] });
      onPublished();
      onOpenChange(false);
      toast.success(
        sentCount > 0
          ? `Job published. ${sentCount} invitation${sentCount === 1 ? '' : 's'} sent.`
          : 'Job published.'
      );
      router.push(`/jobs/${data.jobId}`);
    } catch {
      setError("Couldn't publish this job. Try again.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle>Publish {data.title || 'this job'}?</DialogTitle>
          <DialogDescription>
            Review the summary below before it goes live.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-md border border-border p-3">
            <SummaryRow label="Interview format" value={formatLabel(data.format)} />
            <SummaryRow label="Questions" value={String(data.questionCount)} />
            <SummaryRow label="Estimated time" value={`${data.estimatedMinutes} min`} />
            <SummaryRow label="Team size" value={String(data.teamSize)} />
            <SummaryRow label="Invitations queued" value={String(data.inviteCount)} />
          </div>

          {blockers.length > 0 && (
            <div className="space-y-1.5 rounded-md border border-error-border bg-error-wash p-3">
              {blockers.map((b, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-error-ink" />
                  <Link href={b.href} className="text-body-sm text-error-ink underline underline-offset-2">
                    {b.text}
                  </Link>
                </div>
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-1.5 rounded-md border border-warning-border bg-warning-wash p-3">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning-ink" />
                  <Link href={w.href} className="text-body-sm text-warning-ink underline underline-offset-2">
                    {w.text}
                  </Link>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="text-body-sm text-error">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border-strong bg-transparent px-4 text-button text-heading transition-colors hover:bg-card-hover"
          >
            Keep editing
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!canPublish || publishing}
            aria-busy={publishing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-button text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
          >
            {publishing && <Loader2 size={15} className="animate-spin" />}
            Publish job
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-caption text-muted">{label}</p>
      <p className="text-body-sm font-medium text-heading">{value}</p>
    </div>
  );
}
