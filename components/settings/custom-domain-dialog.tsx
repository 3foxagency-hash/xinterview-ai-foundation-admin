'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Info, Copy, Check } from 'lucide-react';
import { SettingsInput } from './settings-input';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

interface CustomDomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: { subdomain: string; domain: string } | null;
  onSave: (subdomain: string, domain: string) => Promise<void>;
}

/**
 * Two steps: enter the domain, then show the DNS record to add. Mirrors the
 * live product, including the Cloudflare grey-cloud warning.
 */
export function CustomDomainDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: CustomDomainDialogProps) {
  const [subdomain, setSubdomain] = React.useState('');
  const [domain, setDomain] = React.useState('');
  const [step, setStep] = React.useState<'enter' | 'dns'>('enter');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const subRef = React.useRef<HTMLInputElement>(null);

  // Seed only on open — depending on `initial` would send the dialog back to
  // the entry step as soon as saving updates the stored domain.
  const initialRef = React.useRef(initial);
  initialRef.current = initial;
  React.useEffect(() => {
    if (!open) return;
    setSubdomain(initialRef.current?.subdomain ?? '');
    setDomain(initialRef.current?.domain ?? '');
    setStep('enter');
    setLoading(false);
    setError(null);
    setCopied(false);
    setTimeout(() => subRef.current?.focus(), 50);
  }, [open]);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSave(subdomain, domain);
      setStep('dns');
    } catch (e2) {
      setError(getSettingsErrorMessage(e2));
    } finally {
      setLoading(false);
    }
  };

  const target = 'cname.xinterview.ai';

  const copyTarget = async () => {
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'enter' ? 'Connect your domain' : 'Add this DNS record'}
          </DialogTitle>
          <DialogDescription className="text-body text-muted">
            {step === 'enter'
              ? 'Use your own web address on candidate pages and shareable links.'
              : 'Add the record below with your DNS provider, then give it up to 24 hours to propagate.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'enter' ? (
          <form onSubmit={handleNext} noValidate className="flex flex-col gap-4 py-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <SettingsInput
                  ref={subRef}
                  label="Subdomain"
                  value={subdomain}
                  onChange={(e) => {
                    setSubdomain(e.target.value);
                    setError(null);
                  }}
                  placeholder="interview"
                />
              </div>
              <span className="pb-2.5 text-body text-muted">.</span>
              <div className="flex-1">
                <SettingsInput
                  label="Domain"
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value);
                    setError(null);
                  }}
                  placeholder="acme.com"
                />
              </div>
            </div>

            {subdomain && domain && (
              <p className="text-body-sm text-muted">
                Candidates will see{' '}
                <span className="font-mono text-heading">
                  {subdomain}.{domain}
                </span>
              </p>
            )}

            {error && (
              <p role="alert" className="text-body-sm text-error">
                {error}
              </p>
            )}

            <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5">
              <Info size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden />
              <p className="text-body-sm text-heading">
                Using Cloudflare DNS? Set the record to the grey cloud (DNS only). The orange
                cloud stops the domain activating.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Next
              </button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div className="overflow-hidden rounded-md border border-border">
              <div className="grid grid-cols-3 gap-2 border-b border-border bg-muted-bg px-3 py-2 text-caption font-semibold uppercase tracking-wider text-muted">
                <span>Type</span>
                <span>Name</span>
                <span>Value</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-2 px-3 py-2.5 font-mono text-body-sm text-heading">
                <span>CNAME</span>
                <span className="truncate">{subdomain}</span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate">{target}</span>
                  <button
                    type="button"
                    onClick={copyTarget}
                    aria-label="Copy DNS value"
                    className="shrink-0 rounded p-1 text-muted transition-colors hover:text-heading"
                  >
                    {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                  </button>
                </span>
              </div>
            </div>

            <p className="text-body-sm text-muted">
              We&apos;ll check the record automatically and switch your links over once it
              resolves.
            </p>

            <DialogFooter>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
              >
                Done
              </button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
