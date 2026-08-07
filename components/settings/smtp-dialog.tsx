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
import { Check, Loader2, Mail, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsInput } from './settings-input';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';
import type { SmtpConfig } from '@/lib/api/settings';

interface SmtpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: SmtpConfig | null;
  onSave: (config: SmtpConfig) => Promise<void>;
  onTest: (to: string) => Promise<void>;
}

const STEPS = [
  { n: 1, title: 'Choose your mailer', hint: 'Select provider' },
  { n: 2, title: 'Configure settings', hint: 'Add configuration' },
  { n: 3, title: 'Send test email', hint: 'Verify setup' },
];

const EMPTY: SmtpConfig = {
  provider: 'smtp',
  host: '',
  port: '587',
  username: '',
  password: '',
  fromEmail: '',
  fromName: '',
  useTls: true,
};

export function SmtpDialog({ open, onOpenChange, initial, onSave, onTest }: SmtpDialogProps) {
  const [step, setStep] = React.useState(1);
  const [config, setConfig] = React.useState<SmtpConfig>(EMPTY);
  const [testEmail, setTestEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [testSent, setTestSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Seed state only when the dialog opens. Depending on `initial` here would
  // reset the wizard back to step 1 the moment a save updates the saved config.
  const initialRef = React.useRef(initial);
  initialRef.current = initial;
  React.useEffect(() => {
    if (!open) return;
    setStep(1);
    setConfig(initialRef.current ?? EMPTY);
    setTestEmail('');
    setLoading(false);
    setTestSent(false);
    setError(null);
  }, [open]);

  const set = <K extends keyof SmtpConfig>(k: K, v: SmtpConfig[K]) => {
    setConfig((c) => ({ ...c, [k]: v }));
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    try {
      await onSave(config);
      setStep(3);
    } catch (e) {
      setError(getSettingsErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setError(null);
    setLoading(true);
    try {
      await onTest(testEmail);
      setTestSent(true);
    } catch (e) {
      setError(getSettingsErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const isMailerSend = config.provider === 'mailersend';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>SMTP configuration</DialogTitle>
          <DialogDescription className="text-body text-muted">
            Send candidate emails from your own address.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <ol className="flex items-start gap-2 py-2">
          {STEPS.map((s) => {
            const done = step > s.n;
            const current = step === s.n;
            return (
              <li key={s.n} className="flex flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold',
                      done && 'bg-success text-primary-foreground',
                      current && 'bg-primary text-primary-foreground',
                      !done && !current && 'border border-border text-muted'
                    )}
                  >
                    {done ? <Check size={12} strokeWidth={3} /> : s.n}
                  </span>
                  <div className={cn('h-px flex-1', done ? 'bg-success' : 'bg-border')} />
                </div>
                <span
                  className={cn(
                    'text-caption font-medium',
                    current ? 'text-heading' : 'text-muted'
                  )}
                >
                  {s.title}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Step 1 — provider */}
        {step === 1 && (
          <div className="flex flex-col gap-3 py-2">
            {(
              [
                {
                  id: 'mailersend' as const,
                  icon: Mail,
                  name: 'MailerSend',
                  blurb: 'Recommended. Up to 3,000 free emails a month.',
                },
                {
                  id: 'smtp' as const,
                  icon: Server,
                  name: 'Custom SMTP',
                  blurb: 'Send through your own SMTP server for full control.',
                },
              ]
            ).map((opt) => {
              const Icon = opt.icon;
              const selected = config.provider === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => set('provider', opt.id)}
                  aria-pressed={selected}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                    selected
                      ? 'border-primary bg-active-menu-bg'
                      : 'border-border hover:border-border-strong'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                      selected ? 'bg-primary/10' : 'bg-muted-bg'
                    )}
                  >
                    <Icon size={16} className={selected ? 'text-primary' : 'text-muted'} />
                  </span>
                  <span className="flex flex-col">
                    <span className={cn('text-body font-medium', selected ? 'text-primary' : 'text-heading')}>
                      {opt.name}
                    </span>
                    <span className="text-body-sm text-muted">{opt.blurb}</span>
                  </span>
                  {selected && <Check size={16} className="ml-auto shrink-0 text-primary" />}
                </button>
              );
            })}
            <p className="text-body-sm text-muted">
              Regular inboxes often have daily sending limits that can throttle candidate emails.
            </p>
          </div>
        )}

        {/* Step 2 — settings */}
        {step === 2 && (
          <div className="flex flex-col gap-4 py-2">
            {!isMailerSend && (
              <>
                <SettingsInput
                  label="Host name"
                  value={config.host}
                  onChange={(e) => set('host', e.target.value)}
                  placeholder="smtp.example.com"
                />
                <SettingsInput
                  label="Port"
                  value={config.port}
                  onChange={(e) => set('port', e.target.value)}
                  placeholder="587"
                />
                <SettingsInput
                  label="Username"
                  value={config.username}
                  onChange={(e) => set('username', e.target.value)}
                  placeholder="username@example.com"
                />
                <SettingsInput
                  label="Password or API key"
                  type="password"
                  value={config.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="••••••••"
                />
              </>
            )}
            {isMailerSend && (
              <SettingsInput
                label="MailerSend API token"
                type="password"
                value={config.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="••••••••"
              />
            )}
            <SettingsInput
              label="From email"
              type="email"
              value={config.fromEmail}
              onChange={(e) => set('fromEmail', e.target.value)}
              placeholder="hiring@acme.com"
            />
            <SettingsInput
              label="From name"
              value={config.fromName}
              onChange={(e) => set('fromName', e.target.value)}
              placeholder="Acme Talent Team"
            />
            {!isMailerSend && (
              <label className="flex items-center gap-2 text-body-sm text-bodyText">
                <input
                  type="checkbox"
                  checked={config.useTls}
                  onChange={(e) => set('useTls', e.target.checked)}
                  className="h-4 w-4 rounded border-border-strong accent-[var(--primary)]"
                />
                Use TLS
              </label>
            )}
            {error && (
              <p role="alert" className="text-body-sm text-error">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Step 3 — test */}
        {step === 3 && (
          <div className="flex flex-col gap-4 py-2">
            {testSent ? (
              <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-3">
                <Check size={16} className="mt-0.5 shrink-0 text-success" aria-hidden />
                <p className="text-body-sm text-heading">
                  Test email sent to <span className="font-medium">{testEmail}</span>. Check the
                  inbox to confirm it arrived.
                </p>
              </div>
            ) : (
              <p className="text-body-sm text-muted">
                Send a test to confirm your settings work before candidates start receiving email.
              </p>
            )}
            <SettingsInput
              label="Send test email to"
              type="email"
              value={testEmail}
              onChange={(e) => {
                setTestEmail(e.target.value);
                setError(null);
                setTestSent(false);
              }}
              error={error ?? undefined}
              placeholder="you@acme.com"
            />
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
            >
              Back
            </button>
          )}
          {step === 1 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
            >
              Continue
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              aria-busy={loading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Save and continue
            </button>
          )}
          {step === 3 && (
            <>
              <button
                type="button"
                onClick={handleTest}
                disabled={loading || !testEmail.trim()}
                aria-busy={loading}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-primary/30 px-4 text-button text-primary transition-colors hover:bg-active-menu-bg disabled:pointer-events-none disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Send test
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
              >
                Finish
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
