'use client';

import * as React from 'react';
import { format as formatDate, isPast, isToday } from 'date-fns';
import {
  Link as LinkIcon,
  Copy,
  Check,
  ChevronDown,
  Lock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizard } from './wizard-context';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { getLinkSettings, updateLinkSettings, type LinkSettings } from '@/lib/api/invites';
import { track } from '@/lib/utils/analytics';
import { toast } from 'sonner';

interface ShareLinkCardProps {
  id?: string;
  jobId: string;
  isDraft: boolean;
  candidateUrl: string;
  applicationDeadline: string;
}

export function ShareLinkCard({ id, jobId, isDraft, candidateUrl, applicationDeadline }: ShareLinkCardProps) {
  const { setSaveState, registerRetry } = useWizard();
  const [settings, setSettings] = React.useState<LinkSettings | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [expiryOpen, setExpiryOpen] = React.useState(false);
  const [turnOffOpen, setTurnOffOpen] = React.useState(false);

  React.useEffect(() => {
    // Re-fetches whenever the draft/published transition flips — publishing
    // activates the link server-side (PublishDialog), and this card owns its
    // own copy of settings rather than reading it from the parent.
    getLinkSettings(jobId).then(setSettings).catch(() => {});
  }, [jobId, isDraft]);

  const persist = React.useCallback(
    async (patch: Partial<LinkSettings>, eventSetting?: string) => {
      setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
      setSaveState('saving');
      try {
        const updated = await updateLinkSettings(jobId, patch);
        setSettings(updated);
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
        if (eventSetting) track('invite_link_settings_changed', { setting: eventSetting });
      } catch {
        setSaveState('error');
        registerRetry(() => persist(patch, eventSetting));
      }
    },
    [jobId, setSaveState, registerRetry]
  );

  const handleToggle = (next: boolean) => {
    if (isDraft || !settings) return;
    if (!next) {
      setTurnOffOpen(true);
      return;
    }
    persist({ active: true });
    track('invite_link_toggled', { on: true });
  };

  const confirmTurnOff = () => {
    persist({ active: false });
    track('invite_link_toggled', { on: false });
    setTurnOffOpen(false);
  };

  const handleCopy = async () => {
    if (isDraft) return;
    try {
      await navigator.clipboard.writeText(candidateUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      track('invite_link_copied', {});
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const expiryDate = settings?.expiryDate ? new Date(settings.expiryDate) : undefined;
  const deadlineDate = applicationDeadline ? new Date(applicationDeadline) : undefined;
  const expiryDiffers =
    settings?.expiryDate && applicationDeadline && settings.expiryDate !== applicationDeadline;

  if (!settings) {
    return (
      <div id={id} className="h-64 animate-pulse rounded-lg border border-border bg-card-hover" />
    );
  }

  return (
    <div id={id} className="scroll-mt-4 rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-h3 text-heading">
            <LinkIcon size={16} className="text-muted" />
            Share interview link
          </h3>
          <p className="mt-1 text-body-sm text-muted">
            Anyone with this link can view the job and start the interview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-body-sm font-medium', settings.active ? 'text-success' : 'text-muted')}>
            Link is active
          </span>
          <Switch
            checked={settings.active}
            onCheckedChange={handleToggle}
            disabled={isDraft}
            aria-label={settings.active ? 'Turn off the interview link' : 'Turn on the interview link'}
          />
        </div>
      </div>

      {isDraft && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-warning-border bg-warning-wash px-3 py-2.5">
          <Lock size={14} className="mt-0.5 shrink-0 text-warning-ink" />
          <p className="text-caption text-warning-ink">
            This job is still a draft. Publish it to make the link work.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Input
            readOnly
            value={isDraft ? candidateUrl.replace(/[a-zA-Z0-9]/g, '•').slice(0, 48) : candidateUrl}
            className={cn('h-10 font-mono text-body-sm', isDraft && 'text-muted')}
            aria-label="Interview link"
            onFocus={(e) => !isDraft && e.currentTarget.select()}
          />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={isDraft}
          title={isDraft ? 'Publish the job to enable the link' : undefined}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover disabled:pointer-events-none disabled:opacity-50"
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>

      {/* Link settings — collapsible */}
      <div className="mt-4 rounded-md border border-border">
        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          aria-expanded={settingsOpen}
          className="flex h-11 w-full items-center gap-2 px-3 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-active-menu-bg text-primary">
            <ChevronDown size={13} className={cn('transition-transform', settingsOpen && 'rotate-180')} />
          </span>
          Link settings
        </button>

        {settingsOpen && (
          <div className="space-y-5 border-t border-border p-4">
            {/* Expiry date */}
            <div>
              <label className="mb-1.5 block text-body-sm font-semibold text-heading">
                Expiry date
              </label>
              <Popover open={expiryOpen} onOpenChange={setExpiryOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full max-w-xs items-center gap-2 rounded-md border border-border bg-surface px-3 text-left text-body-sm text-heading transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    <CalendarIcon size={14} className="text-muted" />
                    <span>{expiryDate ? formatDate(expiryDate, 'PPP') : 'Pick a date'}</span>
                    <ChevronDown size={14} className="ml-auto text-muted" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={(d) => {
                      if (d && !isPast(d)) {
                        persist({ expiryDate: formatDate(d, 'yyyy-MM-dd') }, 'expiryDate');
                        setExpiryOpen(false);
                      }
                    }}
                    disabled={(d) => isPast(d) && !isToday(d)}
                  />
                  <p className="border-t border-border px-3 py-2 text-caption text-muted">
                    Past dates are not available.
                  </p>
                </PopoverContent>
              </Popover>
              {expiryDiffers && (
                <p className="mt-1.5 text-caption text-muted">
                  This is different from the application deadline
                  {deadlineDate ? ` (${formatDate(deadlineDate, 'PPP')})` : ''} set in Job details.
                </p>
              )}
            </div>

            {/* Limit total responses */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-body-sm font-semibold text-heading">
                  Limit total responses
                </label>
                <Switch
                  checked={settings.limitEnabled}
                  onCheckedChange={(v) => persist({ limitEnabled: v }, 'limitEnabled')}
                  aria-label="Limit total responses"
                />
              </div>
              {settings.limitEnabled && (
                <Input
                  type="number"
                  min={1}
                  value={settings.limitCount}
                  onChange={(e) =>
                    setSettings((prev) => (prev ? { ...prev, limitCount: Number(e.target.value) } : prev))
                  }
                  onBlur={(e) => persist({ limitCount: Number(e.target.value) }, 'limitCount')}
                  className="mt-2 h-9 max-w-[140px]"
                  aria-label="Maximum number of responses"
                />
              )}
            </div>

            {/* Require email before starting */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <label className="text-body-sm font-semibold text-heading">
                  Require email before starting
                </label>
                <p className="mt-0.5 text-caption text-muted">
                  Candidates must identify themselves before the interview begins.
                </p>
              </div>
              <Switch
                checked={settings.requireEmail}
                onCheckedChange={(v) => persist({ requireEmail: v }, 'requireEmail')}
                aria-label="Require email before starting"
              />
            </div>
          </div>
        )}
      </div>

      <Dialog open={turnOffOpen} onOpenChange={setTurnOffOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Turn off the link?</DialogTitle>
            <DialogDescription className="text-body text-muted">
              Anyone who opens it will see that the interview is closed. Candidates who already
              started are unaffected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setTurnOffOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-transparent px-4 text-button text-heading transition-colors hover:bg-card-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmTurnOff}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Turn off link
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
