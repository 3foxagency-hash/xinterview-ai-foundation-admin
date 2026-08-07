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

  return (
    <>
      <SettingsPage
        title="Integrations"
        scope="company"
        companyName={companyName}
        description="API keys, email delivery, your own domain and connected apps."
      >
        {/* ── API keys ── */}
        <SettingsSection
          title="API keys"
          description="Authenticate requests to the XInterview API and connect tools like Zapier."
        >
          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
            <p className="text-body-sm text-muted">
              {keys.length === 0
                ? 'No API keys yet.'
                : `${keys.length} key${keys.length === 1 ? '' : 's'}`}
            </p>
            <button
              type="button"
              onClick={() => setKeyDialog(true)}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
            >
              <Plus size={15} />
              Generate new
            </button>
          </div>

          {keys.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <KeyRound size={22} className="mx-auto text-muted" aria-hidden />
              <p className="mt-2.5 text-body-sm text-muted">
                Generate a key to start using the API.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-border bg-muted-bg">
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k, i) => (
                    <tr key={k.id} className={cn(i > 0 && 'border-t border-border')}>
                      <td className="px-4 py-3 text-body font-medium text-heading">{k.name}</td>
                      <td className="px-4 py-3 font-mono text-body-sm text-muted">
                        {k.maskedKey}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-muted">
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
            </div>
          )}
        </SettingsSection>

        {/* ── Connections ── */}
        <SettingsSection
          title="Connections"
          description="Email delivery, your own domain, branding and connected apps."
        >
          {/* SMTP */}
          <IntegrationRow
            icon={Mail}
            title="SMTP configuration"
            description="Send candidate notifications, reminders and other emails from your own account."
            active={state.smtpConnected}
            activeLabel={state.smtp?.fromEmail ? `Sending from ${state.smtp.fromEmail}` : undefined}
            action={
              <div className="flex gap-2">
                {state.smtpConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnectSmtp}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong px-3 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover"
                  >
                    Disconnect
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSmtpDialog(true)}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
                >
                  {state.smtpConnected ? 'Edit' : 'Set up'}
                </button>
              </div>
            }
          />

          {/* Custom domain */}
          <IntegrationRow
            icon={Globe}
            title="Custom domain"
            description="Use your own web address on the application page and shareable links."
            active={!!state.customDomain}
            activeLabel={domainLabel ?? undefined}
            action={
              <button
                type="button"
                onClick={() => setDomainDialog(true)}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
              >
                {state.customDomain ? 'Manage' : 'Connect'}
              </button>
            }
          />

          {/* Branding */}
          <IntegrationRow
            icon={BadgeCheck}
            title="Remove XInterview branding"
            description="Hide “Powered by XInterview” on candidate pages and shareable links."
            active={state.brandingRemoved}
            activeLabel={state.brandingRemoved ? 'Branding hidden' : undefined}
            action={
              <div className="flex items-center gap-2">
                {brandingBusy && <Loader2 size={15} className="animate-spin text-muted" />}
                <Switch
                  checked={state.brandingRemoved}
                  onCheckedChange={handleBranding}
                  disabled={brandingBusy}
                  aria-label="Remove XInterview branding"
                />
              </div>
            }
          />

          {/* Zapier */}
          <IntegrationRow
            icon={Zap}
            title="Zapier integration"
            description="Connect XInterview to Slack, Gmail, Typeform and 5,000+ other apps."
            active={state.zapierActive}
            activeLabel={state.zapierActive ? 'Ready to connect in Zapier' : undefined}
            action={
              <button
                type="button"
                onClick={() => {
                  setZapierDialog(true);
                  if (!state.zapierActive) handleZapier();
                }}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
              >
                {state.zapierActive ? 'View steps' : 'Activate'}
              </button>
            }
          />
        </SettingsSection>

        <p className="text-body-sm text-muted">
          Having trouble? Contact us at{' '}
          <a
            href="mailto:help@xinterview.ai"
            className="font-medium text-primary underline-offset-4 hover:underline"
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

/** One connection row: icon, copy, status and its action. */
function IntegrationRow({
  icon: Icon,
  title,
  description,
  active,
  activeLabel,
  action,
}: {
  icon: typeof Mail;
  title: string;
  description: string;
  active: boolean;
  activeLabel?: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between [&:not(:first-child)]:border-t [&:not(:first-child)]:border-border">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
            active ? 'bg-primary/10' : 'bg-muted-bg'
          )}
        >
          <Icon size={16} className={active ? 'text-primary' : 'text-muted'} aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-body font-medium text-heading">{title}</span>
            {active && (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-caption font-medium text-success">
                Active
              </span>
            )}
          </div>
          <p className="mt-0.5 text-body-sm text-muted">{description}</p>
          {active && activeLabel && (
            <p className="mt-1 truncate font-mono text-body-sm text-bodyText">{activeLabel}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
