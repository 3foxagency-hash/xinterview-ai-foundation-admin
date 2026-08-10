'use client';

import * as React from 'react';
import { Check, Copy, Globe, Info, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { WsSectionPage } from '@/components/workspace/ws-section-page';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsInput } from '@/components/settings/settings-input';
import {
  getIntegrations,
  saveCustomDomain,
  removeCustomDomain,
  type IntegrationState,
} from '@/lib/api/settings';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

/** Where the candidate's browser is pointed once the CNAME resolves. */
const CNAME_TARGET = 'cname.xinterview.ai';

/**
 * Custom domain, moved out of Integrations. A domain is a property of the
 * workspace — every careers page and candidate link it serves belongs to one —
 * so it lives beside the rest of the candidate-facing settings rather than in a
 * list of third-party connections.
 */
export default function DomainSettingsPage() {
  const [state, setState] = React.useState<IntegrationState | null>(null);
  const [subdomain, setSubdomain] = React.useState('');
  const [domain, setDomain] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getIntegrations();
        if (cancelled) return;
        setState(s);
        setSubdomain(s.customDomain?.subdomain ?? '');
        setDomain(s.customDomain?.domain ?? '');
      } catch (e) {
        if (!cancelled) toast.error(getSettingsErrorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const next = await saveCustomDomain(subdomain, domain);
      setState(next);
      toast.success('Domain saved — add the DNS record to finish');
    } catch (err) {
      setError(getSettingsErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const next = await removeCustomDomain();
      setState(next);
      setSubdomain('');
      setDomain('');
      toast.success('Custom domain removed');
    } catch (err) {
      toast.error(getSettingsErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  const copyTarget = async () => {
    try {
      await navigator.clipboard.writeText(CNAME_TARGET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the value');
    }
  };

  const connected = state?.customDomain ?? null;
  const dirty =
    subdomain.trim() !== (connected?.subdomain ?? '') ||
    domain.trim() !== (connected?.domain ?? '');

  return (
    <WsSectionPage
      title="Domain settings"
      description="Serve careers pages and candidate links from your own web address instead of xinterview.ai."
    >
      <div className="flex flex-col gap-8">
        <SettingsSection
          title="Custom domain"
          description="Pick the address candidates will see in their browser."
        >
          <form onSubmit={handleSave} noValidate className="flex flex-col gap-4 p-4 sm:p-5">
            {/* Two halves of one address, so they share a row wherever there's
                room and stack rather than squeeze on a phone. */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <SettingsInput
                  id="ws-subdomain"
                  label="Subdomain"
                  value={subdomain}
                  onChange={(e) => {
                    setSubdomain(e.target.value);
                    setError(null);
                  }}
                  placeholder="interview"
                />
              </div>
              {/* h-10 matches the input, so the dot centres on the field
                  rather than floating beside the label above it. */}
              <span
                className="hidden h-10 items-center text-body text-muted sm:flex"
                aria-hidden
              >
                .
              </span>
              <div className="min-w-0 flex-1">
                <SettingsInput
                  id="ws-domain"
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

            {subdomain.trim() && domain.trim() && (
              <p className="text-body-sm text-muted">
                Candidates will see{' '}
                <span className="break-all font-mono text-heading">
                  {subdomain.trim()}.{domain.trim()}
                </span>
              </p>
            )}

            {error && (
              <p role="alert" className="text-body-sm text-error">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={saving || !dirty}
                aria-busy={saving}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {connected ? 'Update domain' : 'Save domain'}
              </button>
              {connected && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={removing}
                  aria-busy={removing}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-body-sm font-medium text-muted transition-colors hover:bg-error-banner-bg hover:text-error disabled:opacity-50"
                >
                  {removing ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                  Remove
                </button>
              )}
            </div>
          </form>
        </SettingsSection>

        {/* The DNS record only means something once there's a domain to point
            at, so it stays hidden until one is saved. */}
        {connected && (
          <SettingsSection
            title="DNS record"
            description="Add this record with your DNS provider, then give it up to 24 hours to propagate."
          >
            <div className="p-4 sm:p-5">
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[420px]">
                  <thead>
                    <tr className="border-b border-border bg-muted-bg">
                      {['Type', 'Name', 'Value'].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-3 py-2 text-left text-caption font-medium text-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-mono text-body-sm text-heading">
                      <td className="px-3 py-2.5">CNAME</td>
                      <td className="px-3 py-2.5">{connected.subdomain}</td>
                      <td className="px-3 py-2.5">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate">{CNAME_TARGET}</span>
                          <button
                            type="button"
                            onClick={copyTarget}
                            aria-label="Copy DNS value"
                            className="shrink-0 rounded p-1 text-muted transition-colors hover:text-heading"
                          >
                            {copied ? (
                              <Check size={13} className="text-success" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5">
                <Info size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden />
                <p className="text-body-sm text-heading">
                  Using Cloudflare DNS? Set the record to the grey cloud (DNS only). The
                  orange cloud stops the domain activating.
                </p>
              </div>

              <p className="mt-3 flex items-center gap-2 text-body-sm text-muted">
                <Globe size={14} className="shrink-0" aria-hidden />
                We check the record automatically and switch your links over once it
                resolves.
              </p>
            </div>
          </SettingsSection>
        )}

        {/* Status is a dot plus a word, never colour alone. */}
        <p className="flex items-center gap-2 text-body-sm text-muted">
          <span
            className={cn('h-1.5 w-1.5 rounded-full', connected ? 'bg-success' : 'bg-gray-500')}
            aria-hidden
          />
          {connected
            ? `Serving from ${connected.subdomain}.${connected.domain} once DNS resolves.`
            : 'No custom domain yet — candidate links use xinterview.ai.'}
        </p>
      </div>
    </WsSectionPage>
  );
}
