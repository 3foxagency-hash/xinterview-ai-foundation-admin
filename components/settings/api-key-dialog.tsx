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
import { Loader2, Copy, Check, AlertTriangle } from 'lucide-react';
import { SettingsInput } from './settings-input';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, expiresAt: string | null) => Promise<string>;
}

/**
 * Two phases: the create form, then a one-time reveal of the secret. The key is
 * never retrievable afterwards, so the reveal step is deliberately blunt about
 * copying it now.
 */
export function ApiKeyDialog({ open, onOpenChange, onCreate }: ApiKeyDialogProps) {
  const [name, setName] = React.useState('');
  const [expiresAt, setExpiresAt] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [secret, setSecret] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const nameRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setName('');
    setExpiresAt('');
    setError(null);
    setLoading(false);
    setSecret(null);
    setCopied(false);
    setTimeout(() => nameRef.current?.focus(), 50);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Give your API key a name.');
      return;
    }
    setLoading(true);
    try {
      const created = await onCreate(name, expiresAt || null);
      setSecret(created);
    } catch (e2) {
      setError(getSettingsErrorMessage(e2));
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the value is still selectable on screen
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        {secret ? (
          <>
            <DialogHeader>
              <DialogTitle>Copy your API key</DialogTitle>
              <DialogDescription className="text-body text-muted">
                This is the only time we&apos;ll show it.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5">
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden />
                <p className="text-body-sm text-heading">
                  Store this somewhere safe. If you lose it you&apos;ll need to generate a new key.
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted-bg px-3 py-2 font-mono text-body-sm text-heading">
                  {secret}
                </code>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border-strong px-3 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover"
                >
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
              >
                Done
              </button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create new API key</DialogTitle>
              <DialogDescription className="text-body text-muted">
                Use API keys to connect XInterview to Zapier and your own tools.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 py-2">
              <SettingsInput
                ref={nameRef}
                label="Key name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                error={error ?? undefined}
                placeholder="e.g. Zapier production"
                maxLength={60}
              />
              <div>
                <label
                  htmlFor="api-key-expiry"
                  className="mb-1.5 block text-body-sm font-medium text-heading"
                >
                  Expiration date (optional)
                </label>
                <input
                  id="api-key-expiry"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-body text-heading transition-all hover:border-border-strong"
                />
                <p className="mt-1 text-body-sm text-muted">
                  Leave blank for a key that never expires.
                </p>
              </div>

              <DialogFooter className="gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-transparent px-4 text-button text-heading transition-colors hover:bg-card-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-all hover:bg-primary-hover disabled:opacity-50"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Create key
                </button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
