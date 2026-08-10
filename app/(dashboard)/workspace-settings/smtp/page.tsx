'use client';

import * as React from 'react';
import { Check, Loader2, Mail, Send, Server } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { WsSectionPage } from '@/components/workspace/ws-section-page';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsInput } from '@/components/settings/settings-input';
import {
  getIntegrations,
  saveSmtpConfig,
  sendSmtpTestEmail,
  disconnectSmtp,
  type IntegrationState,
  type SmtpConfig,
} from '@/lib/api/settings';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

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

const PROVIDERS = [
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
];

/**
 * SMTP, moved out of Integrations. As a full page the three steps the dialog
 * used to walk through — pick a provider, fill in the credentials, send a test
 * — become three sections you can revisit in any order, which is how you
 * actually work with mail settings once they're set up.
 */
export default function SmtpSettingsPage() {
  const [state, setState] = React.useState<IntegrationState | null>(null);
  const [config, setConfig] = React.useState<SmtpConfig>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [testEmail, setTestEmail] = React.useState('');
  const [testing, setTesting] = React.useState(false);
  const [testSentTo, setTestSentTo] = React.useState<string | null>(null);
  const [testError, setTestError] = React.useState<string | null>(null);

  const [disconnecting, setDisconnecting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getIntegrations();
        if (cancelled) return;
        setState(s);
        setConfig(s.smtp ?? EMPTY);
      } catch (e) {
        if (!cancelled) toast.error(getSettingsErrorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof SmtpConfig>(k: K, v: SmtpConfig[K]) => {
    setConfig((c) => ({ ...c, [k]: v }));
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const next = await saveSmtpConfig(config);
      setState(next);
      toast.success('SMTP settings saved');
    } catch (err) {
      setError(getSettingsErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestError(null);
    setTestSentTo(null);
    setTesting(true);
    try {
      await sendSmtpTestEmail(testEmail);
      setTestSentTo(testEmail);
    } catch (err) {
      setTestError(getSettingsErrorMessage(err));
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const next = await disconnectSmtp();
      setState(next);
      setConfig(EMPTY);
      setTestSentTo(null);
      toast.success('SMTP disconnected');
    } catch (err) {
      toast.error(getSettingsErrorMessage(err));
    } finally {
      setDisconnecting(false);
    }
  };

  const connected = !!state?.smtpConnected;
  const isMailerSend = config.provider === 'mailersend';

  return (
    <WsSectionPage
      title="SMTP settings"
      description="Send candidate emails from your own mail server, so they arrive from your address rather than ours."
    >
      <div className="flex flex-col gap-8">
        {/* ── Provider ──
            No section card around these: the options already carry a border,
            and a card inside a card stacks two frames on the same content. */}
        <section>
          <h3 className="text-h3 text-heading">Mail provider</h3>
          <p className="mt-1 text-body-sm text-muted">
            Regular inboxes often have daily sending limits that can throttle candidate
            emails.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PROVIDERS.map((opt) => {
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
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'min-w-0 truncate text-body font-medium',
                          selected ? 'text-primary' : 'text-heading'
                        )}
                      >
                        {opt.name}
                      </span>
                      {selected && (
                        <Check size={16} className="ml-auto shrink-0 text-primary" />
                      )}
                    </span>
                    <span className="mt-0.5 text-body-sm text-muted">{opt.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Credentials ── */}
        <SettingsSection
          title="Configuration"
          description={
            isMailerSend
              ? 'Paste the API token from your MailerSend dashboard.'
              : 'The connection details from your mail provider.'
          }
        >
          <form onSubmit={handleSave} noValidate className="flex flex-col gap-4 p-4 sm:p-5">
            {isMailerSend ? (
              <SettingsInput
                label="MailerSend API token"
                type="password"
                value={config.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="••••••••"
              />
            ) : (
              <>
                {/* Host and port belong together; port is narrow enough that a
                    full row for it would look like a mistake. */}
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <SettingsInput
                      label="Host name"
                      value={config.host}
                      onChange={(e) => set('host', e.target.value)}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="sm:w-28">
                    <SettingsInput
                      label="Port"
                      inputMode="numeric"
                      value={config.port}
                      onChange={(e) => set('port', e.target.value)}
                      placeholder="587"
                    />
                  </div>
                </div>
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

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="min-w-0 flex-1">
                <SettingsInput
                  label="From email"
                  type="email"
                  value={config.fromEmail}
                  onChange={(e) => set('fromEmail', e.target.value)}
                  placeholder="hiring@acme.com"
                />
              </div>
              <div className="min-w-0 flex-1">
                <SettingsInput
                  label="From name"
                  value={config.fromName}
                  onChange={(e) => set('fromName', e.target.value)}
                  placeholder="Acme Talent Team"
                />
              </div>
            </div>

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

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Save settings
              </button>
              {connected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  aria-busy={disconnecting}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-body-sm font-medium text-muted transition-colors hover:bg-error-banner-bg hover:text-error disabled:opacity-50"
                >
                  {disconnecting && <Loader2 size={15} className="animate-spin" />}
                  Disconnect
                </button>
              )}
            </div>
          </form>
        </SettingsSection>

        {/* ── Test ── Only meaningful once something is saved to test against. */}
        {connected && (
          <SettingsSection
            title="Send a test email"
            description="Confirm your settings work before candidates start receiving mail."
          >
            <form onSubmit={handleTest} noValidate className="flex flex-col gap-4 p-4 sm:p-5">
              {testSentTo && (
                <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-3">
                  <Check size={16} className="mt-0.5 shrink-0 text-success" aria-hidden />
                  <p className="text-body-sm text-heading">
                    Test email sent to <span className="font-medium">{testSentTo}</span>. Check
                    the inbox to confirm it arrived.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <SettingsInput
                    label="Send to"
                    type="email"
                    value={testEmail}
                    onChange={(e) => {
                      setTestEmail(e.target.value);
                      setTestError(null);
                      setTestSentTo(null);
                    }}
                    error={testError ?? undefined}
                    placeholder="you@acme.com"
                  />
                </div>
                {/* mt-[26px] on desktop drops the button to the input's own
                    baseline, past the label above it. */}
                <button
                  type="submit"
                  disabled={testing || !testEmail.trim()}
                  aria-busy={testing}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover disabled:pointer-events-none disabled:opacity-50 sm:mt-[26px]"
                >
                  {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Send test
                </button>
              </div>
            </form>
          </SettingsSection>
        )}

        <p className="flex items-center gap-2 text-body-sm text-muted">
          <span
            className={cn('h-1.5 w-1.5 rounded-full', connected ? 'bg-success' : 'bg-gray-500')}
            aria-hidden
          />
          {connected
            ? `Sending as ${state?.smtp?.fromEmail ?? 'your address'}.`
            : 'Not set up — emails go out from xinterview.ai.'}
        </p>
      </div>
    </WsSectionPage>
  );
}
