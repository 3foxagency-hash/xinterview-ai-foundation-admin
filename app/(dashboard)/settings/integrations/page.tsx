'use client';

import * as React from 'react';
import {
  Plus,
  KeyRound,
  Mail,
  Globe,
  BadgeCheck,
  Zap,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsPage } from '@/components/settings';
import { SettingsSection } from '@/components/settings/settings-section';
import { Switch } from '@/components/ui/switch';
import { ApiKeyDialog } from '@/components/settings/api-key-dialog';
import { SmtpDialog } from '@/components/settings/smtp-dialog';
import { CustomDomainDialog } from '@/components/settings/custom-domain-dialog';
import { ZapierDialog } from '@/components/settings/zapier-dialog';
import { DeleteApiKeyDialog } from '@/components/settings/delete-api-key-dialog';
import { IntegrationsSkeleton } from '@/components/settings/integrations-skeleton';
import {
  getApiKeys,
  createApiKey,
  deleteApiKey,
  getIntegrations,
  saveSmtpConfig,
  sendSmtpTestEmail,
  disconnectSmtp,
  saveCustomDomain,
  setBrandingRemoved,
  setZapierActive,
  getOrganization,
  type ApiKey,
  type IntegrationState,
  type SmtpConfig,
} from '@/lib/api/settings';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

export default function IntegrationsPage() {
  const [keys, setKeys] = React.useState<ApiKey[]>([]);
  const [state, setState] = React.useState<IntegrationState | null>(null);
  const [companyName, setCompanyName] = React.useState<string>();
  const [loading, setLoading] = React.useState(true);

  const [keyDialog, setKeyDialog] = React.useState(false);
  const [smtpDialog, setSmtpDialog] = React.useState(false);
  const [domainDialog, setDomainDialog] = React.useState(false);
  const [zapierDialog, setZapierDialog] = React.useState(false);
  const [deleteKey, setDeleteKey] = React.useState<ApiKey | null>(null);
  const [brandingBusy, setBrandingBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [k, s, org] = await Promise.all([
          getApiKeys(),
          getIntegrations(),
          getOrganization(),
        ]);
        if (cancelled) return;
        setKeys(k);
        setState(s);
        setCompanyName(org.name);
      } catch (e) {
        if (!cancelled) toast.error(getSettingsErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateKey = async (name: string, expiresAt: string | null) => {
    const { key, secret } = await createApiKey(name, expiresAt);
    setKeys((prev) => [key, ...prev]);
    toast.success(`API key "${key.name}" created`);
    return secret;
  };

  const handleDeleteKey = async () => {
    if (!deleteKey) return;
    try {
      await deleteApiKey(deleteKey.id);
      setKeys((prev) => prev.filter((k) => k.id !== deleteKey.id));
      toast.success('API key deleted');
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    } finally {
      setDeleteKey(null);
    }
  };

  const handleSaveSmtp = async (config: SmtpConfig) => {
    const next = await saveSmtpConfig(config);
    setState(next);
    toast.success('SMTP settings saved');
  };

  const handleTestSmtp = async (to: string) => {
    await sendSmtpTestEmail(to);
  };

  const handleDisconnectSmtp = async () => {
    try {
      const next = await disconnectSmtp();
      setState(next);
      toast.success('SMTP disconnected');
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    }
  };

  const handleSaveDomain = async (subdomain: string, domain: string) => {
    const next = await saveCustomDomain(subdomain, domain);
    setState(next);
    toast.success('Domain saved — add the DNS record to finish');
  };

  const handleBranding = async (removed: boolean) => {
    setBrandingBusy(true);
    try {
      const next = await setBrandingRemoved(removed);
      setState(next);
      toast.success(
        removed ? 'XInterview branding removed' : 'XInterview branding restored'
      );
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    } finally {
      setBrandingBusy(false);
    }
  };

  const handleZapier = async () => {
    try {
      const next = await setZapierActive(true);
      setState(next);
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    }
  };

  if (loading || !state) return <IntegrationsSkeleton />;

  const domainLabel = state.customDomain
    ? `${state.customDomain.subdomain}.${state.customDomain.domain}`
    : null;

  const connections = [
    {
      id: 'smtp',
      icon: Mail,
      title: 'Email delivery',
      description: 'Send candidate emails from your own mail server.',
      active: state.smtpConnected,
      detail: state.smtp?.fromEmail ?? null,
      primaryLabel: state.smtpConnected ? 'Edit' : 'Set up',
      onPrimary: () => setSmtpDialog(true),
      onSecondary: state.smtpConnected ? handleDisconnectSmtp : undefined,
      secondaryLabel: 'Disconnect',
    },
    {
      id: 'domain',
      icon: Globe,
      title: 'Custom domain',
      description: 'Serve application pages from your own web address.',
      active: !!state.customDomain,
      detail: domainLabel,
      primaryLabel: state.customDomain ? 'Manage' : 'Connect',
      onPrimary: () => setDomainDialog(true),
    },
    {
      id: 'zapier',
      icon: Zap,
      title: 'Zapier',
      description: 'Connect to Slack, Gmail and 5,000+ other apps.',
      active: state.zapierActive,
      detail: state.zapierActive ? 'Ready to connect in Zapier' : null,
      primaryLabel: state.zapierActive ? 'View steps' : 'Activate',
      onPrimary: () => {
        setZapierDialog(true);
        if (!state.zapierActive) handleZapier();
      },
    },
  ];

  const activeCount = connections.filter((c) => c.active).length;

  return (
    <>
      <SettingsPage
        title="Integrations"
        scope="company"
        companyName={companyName}
        description="Connect XInterview to your own mail server, domain and the tools your team already uses."
      >
        {/* ── Connections ── */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-h3 text-heading">Connections</h2>
              <p className="mt-1 text-body-sm text-muted">
                {activeCount === 0
                  ? 'Nothing connected yet.'
                  : `${activeCount} of ${connections.length} connected.`}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-caption font-medium text-muted">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  activeCount > 0 ? 'bg-success' : 'bg-gray-500'
                )}
                aria-hidden
              />
              {activeCount > 0 ? 'Live' : 'Not set up'}
            </span>
          </div>

          {/* One card per connection — a grid scans far better than a stack of
              full-width rows. Three columns on desktop so all three sit on one
              row; two at tablet; one on mobile. */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {connections.map((c) => (
              <ConnectionCard key={c.id} {...c} />
            ))}
          </div>
        </section>

        {/* ── Branding: a preference, not a connection, so it sits apart ── */}
        <section className="rounded-md border border-border bg-surface p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted-bg">
                <BadgeCheck size={16} className="text-muted" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-body font-medium text-heading">
                  Remove XInterview branding
                </p>
                <p className="mt-0.5 text-body-sm text-muted">
                  Hides &ldquo;Powered by XInterview&rdquo; on candidate pages and shared links.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:pl-4">
              {brandingBusy && <Loader2 size={15} className="animate-spin text-muted" />}
              <Switch
                checked={state.brandingRemoved}
                onCheckedChange={handleBranding}
                disabled={brandingBusy}
                aria-label="Remove XInterview branding"
              />
            </div>
          </div>
        </section>

        {/* ── API keys ── */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-h3 text-heading">API keys</h2>
              <p className="mt-1 text-body-sm text-muted">
                Authenticate requests to the XInterview API.
              </p>
            </div>
            {/* The one Primary button on this page (§8). */}
            <button
              type="button"
              onClick={() => setKeyDialog(true)}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <Plus size={15} />
              Generate key
            </button>
          </div>

          {keys.length === 0 ? (
            <div className="mt-4 rounded-md border border-dashed border-border-strong px-6 py-10 text-center">
              <KeyRound size={20} className="mx-auto text-muted" aria-hidden />
              <p className="mt-3 text-body font-medium text-heading">No API keys yet</p>
              <p className="mt-1 text-body-sm text-muted">
                Generate a key to start making API requests.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-md border border-border bg-surface">
              {/* Desktop: a table. Mobile: stacked cards — four columns at
                  375px forces a horizontal scroll nobody discovers. */}
              <table className="hidden w-full sm:table">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="px-4 py-2.5 text-left text-caption font-medium text-muted">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-left text-caption font-medium text-muted">
                      Key
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-left text-caption font-medium text-muted">
                      Expires
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-caption font-medium text-muted">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k, i) => (
                    <tr key={k.id} className={cn(i > 0 && 'border-t border-border')}>
                      <td className="px-4 py-3 text-body font-medium text-heading">{k.name}</td>
                      <td className="px-4 py-3 font-mono text-body-sm text-muted">{k.maskedKey}</td>
                      <td className="px-4 py-3 font-mono text-body-sm text-muted">
                        {k.expiresAt ?? 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteKey(k)}
                          aria-label={`Delete API key ${k.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-banner-bg hover:text-error"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <ul className="divide-y divide-border sm:hidden">
                {keys.map((k) => (
                  <li key={k.id} className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-body font-medium text-heading">{k.name}</p>
                      <p className="mt-1 truncate font-mono text-body-sm text-muted">
                        {k.maskedKey}
                      </p>
                      <p className="mt-1 text-caption text-muted">
                        Expires{' '}
                        <span className="font-mono">{k.expiresAt ?? 'never'}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteKey(k)}
                      aria-label={`Delete API key ${k.name}`}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-banner-bg hover:text-error"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <p className="text-body-sm text-muted">
          Having trouble? Contact{' '}
          <a
            href="mailto:help@xinterview.ai"
            className="font-medium text-heading underline underline-offset-4 hover:text-primary"
          >
            help@xinterview.ai
          </a>
          .
        </p>
      </SettingsPage>

      <ApiKeyDialog open={keyDialog} onOpenChange={setKeyDialog} onCreate={handleCreateKey} />

      <SmtpDialog
        open={smtpDialog}
        onOpenChange={setSmtpDialog}
        initial={state.smtp}
        onSave={handleSaveSmtp}
        onTest={handleTestSmtp}
      />

      <CustomDomainDialog
        open={domainDialog}
        onOpenChange={setDomainDialog}
        initial={state.customDomain}
        onSave={handleSaveDomain}
      />

      <ZapierDialog
        open={zapierDialog}
        onOpenChange={setZapierDialog}
        onGenerateKey={() => {
          setZapierDialog(false);
          setKeyDialog(true);
        }}
      />

      {deleteKey && (
        <DeleteApiKeyDialog
          open={!!deleteKey}
          onOpenChange={(o) => {
            if (!o) setDeleteKey(null);
          }}
          keyName={deleteKey.name}
          onConfirm={handleDeleteKey}
        />
      )}
    </>
  );
}

/**
 * One connection as a card: icon, name, status dot, copy, and its actions.
 * Cards use Secondary buttons — §8 allows a single Primary per view, and that
 * is "Generate key". A filled button on every card would flatten the hierarchy.
 */
function ConnectionCard({
  icon: Icon,
  title,
  description,
  active,
  detail,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  icon: typeof Mail;
  title: string;
  description: string;
  active: boolean;
  detail: string | null;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    // No hover tint: the card itself isn't clickable — its buttons are — and a
    // tinted card reads as "selected" next to untinted peers.
    <div className="flex min-w-0 flex-col rounded-md border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted-bg">
          <Icon size={16} className="text-heading" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-body font-medium text-heading">{title}</p>
            {/* Status is a dot plus a word — never colour alone (§17). */}
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 text-caption font-medium',
                active ? 'text-success' : 'text-muted'
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  active ? 'bg-success' : 'bg-gray-500'
                )}
                aria-hidden
              />
              {active ? 'Connected' : 'Off'}
            </span>
          </div>
          <p className="mt-1 text-body-sm text-muted">{description}</p>
          {active && detail && (
            <p className="mt-2 truncate font-mono text-caption text-bodyText" title={detail}>
              {detail}
            </p>
          )}
        </div>
      </div>

      {/* mt-auto pins actions to the card bottom so buttons line up across
          the row even when descriptions wrap to different heights. */}
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <button
          type="button"
          onClick={onPrimary}
          className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong px-3 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover"
        >
          {primaryLabel}
        </button>
        {onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-body-sm font-medium text-muted transition-colors hover:bg-card-hover hover:text-heading"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
