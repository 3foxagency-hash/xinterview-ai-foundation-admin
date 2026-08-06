'use client';

import * as React from 'react';
import { Mail, MessageSquare, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsPage } from '@/components/settings';
import { SettingsSection } from '@/components/settings/settings-section';
import { SegmentedControl } from '@/components/settings/segmented-control';
import { Switch } from '@/components/ui/switch';
import { EmailTemplateDialog } from '@/components/settings/email-template-dialog';
import { SmsTemplateDialog } from '@/components/settings/sms-template-dialog';
import { NotificationsSkeleton } from '@/components/settings/notifications-skeleton';
import {
  getEmailTemplates,
  saveEmailTemplate,
  setEmailTemplateEnabled,
  resetEmailTemplate,
  type EmailTemplate,
} from '@/lib/api/email-templates';
import {
  getSmsTemplates,
  saveSmsTemplate,
  setSmsTemplateEnabled,
  resetSmsTemplate,
  type SmsTemplate,
} from '@/lib/api/sms-templates';
import { getOrganization } from '@/lib/api/settings';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

type Channel = 'email' | 'sms';

export default function NotificationsPage() {
  const [channel, setChannel] = React.useState<Channel>('email');
  const [emails, setEmails] = React.useState<EmailTemplate[]>([]);
  const [texts, setTexts] = React.useState<SmsTemplate[]>([]);
  const [companyName, setCompanyName] = React.useState<string>();
  const [loading, setLoading] = React.useState(true);

  const [emailTarget, setEmailTarget] = React.useState<EmailTemplate | null>(null);
  const [smsTarget, setSmsTarget] = React.useState<SmsTemplate | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [e, s, org] = await Promise.all([
          getEmailTemplates(),
          getSmsTemplates(),
          getOrganization(),
        ]);
        if (cancelled) return;
        setEmails(e);
        setTexts(s);
        setCompanyName(org.name);
      } catch (err) {
        if (!cancelled) toast.error(getSettingsErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Email handlers ──
  const toggleEmail = async (t: EmailTemplate, enabled: boolean) => {
    setBusyId(`email-${t.id}`);
    try {
      const next = await setEmailTemplateEnabled(t.id, enabled);
      setEmails((prev) => prev.map((x) => (x.id === next.id ? next : x)));
      toast.success(`${next.name} email ${enabled ? 'enabled' : 'disabled'}`);
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const saveEmail = async (subject: string, body: string) => {
    if (!emailTarget) return;
    const next = await saveEmailTemplate(emailTarget.id, { subject, body });
    setEmails((prev) => prev.map((x) => (x.id === next.id ? next : x)));
    toast.success(`${next.name} email saved`);
  };

  const resetEmail = async () => {
    if (!emailTarget) return { subject: '', body: '' };
    const next = await resetEmailTemplate(emailTarget.id);
    setEmails((prev) => prev.map((x) => (x.id === next.id ? next : x)));
    toast.success('Reset to the default template');
    return { subject: next.subject, body: next.body };
  };

  // ── SMS handlers (kept separate — these APIs will diverge) ──
  const toggleSms = async (t: SmsTemplate, enabled: boolean) => {
    setBusyId(`sms-${t.id}`);
    try {
      const next = await setSmsTemplateEnabled(t.id, enabled);
      setTexts((prev) => prev.map((x) => (x.id === next.id ? next : x)));
      toast.success(`${next.name} SMS ${enabled ? 'enabled' : 'disabled'}`);
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const saveSms = async (body: string) => {
    if (!smsTarget) return;
    const next = await saveSmsTemplate(smsTarget.id, { body });
    setTexts((prev) => prev.map((x) => (x.id === next.id ? next : x)));
    toast.success(`${next.name} SMS saved`);
  };

  const resetSms = async () => {
    if (!smsTarget) return { body: '' };
    const next = await resetSmsTemplate(smsTarget.id);
    setTexts((prev) => prev.map((x) => (x.id === next.id ? next : x)));
    toast.success('Reset to the default template');
    return { body: next.body };
  };

  if (loading) return <NotificationsSkeleton />;

  const isEmail = channel === 'email';
  const activeEmails = emails.filter((t) => t.enabled).length;
  const activeSms = texts.filter((t) => t.enabled).length;

  return (
    <>
      <SettingsPage
        title="Notifications"
        scope="company"
        companyName={companyName}
        description="The emails and text messages XInterview sends on your behalf. Turn each one on or off and tailor the wording."
      >
        <div className="mx-auto w-full max-w-[320px]">
          <SegmentedControl
            options={[
              { value: 'email', label: 'Email' },
              { value: 'sms', label: 'SMS' },
            ]}
            value={channel}
            onChange={(v) => setChannel(v as Channel)}
          />
        </div>

        {isEmail ? (
          <SettingsSection
            title="Email templates"
            description={`${activeEmails} of ${emails.length} enabled. Candidates and recruiters receive these automatically.`}
          >
            {emails.map((t, i) => (
              <TemplateRow
                key={t.id}
                icon={Mail}
                name={t.name}
                description={t.description}
                audience={t.audience}
                enabled={t.enabled}
                busy={busyId === `email-${t.id}`}
                first={i === 0}
                onToggle={(v) => toggleEmail(t, v)}
                onEdit={() => setEmailTarget(t)}
              />
            ))}
          </SettingsSection>
        ) : (
          <SettingsSection
            title="SMS templates"
            description={`${activeSms} of ${texts.length} enabled. Text messages are billed per segment.`}
          >
            {texts.map((t, i) => (
              <TemplateRow
                key={t.id}
                icon={MessageSquare}
                name={t.name}
                description={t.description}
                audience={t.audience}
                enabled={t.enabled}
                busy={busyId === `sms-${t.id}`}
                first={i === 0}
                onToggle={(v) => toggleSms(t, v)}
                onEdit={() => setSmsTarget(t)}
              />
            ))}
          </SettingsSection>
        )}
      </SettingsPage>

      <EmailTemplateDialog
        open={!!emailTarget}
        onOpenChange={(o) => {
          if (!o) setEmailTarget(null);
        }}
        template={emailTarget}
        onSave={saveEmail}
        onReset={resetEmail}
      />

      <SmsTemplateDialog
        open={!!smsTarget}
        onOpenChange={(o) => {
          if (!o) setSmsTarget(null);
        }}
        template={smsTarget}
        onSave={saveSms}
        onReset={resetSms}
      />
    </>
  );
}

/** One template row: icon, name, description, audience, toggle and Edit. */
function TemplateRow({
  icon: Icon,
  name,
  description,
  audience,
  enabled,
  busy,
  first,
  onToggle,
  onEdit,
}: {
  icon: typeof Mail;
  name: string;
  description: string;
  audience: string;
  enabled: boolean;
  busy: boolean;
  first: boolean;
  onToggle: (v: boolean) => void;
  onEdit: () => void;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between',
        !first && 'border-t border-border'
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
            enabled ? 'bg-primary/10' : 'bg-muted-bg'
          )}
        >
          <Icon size={16} className={enabled ? 'text-primary' : 'text-muted'} aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-body font-medium text-heading">{name}</span>
            <span className="rounded-full border border-border bg-muted-bg px-2 py-0.5 text-caption text-muted">
              {audience}
            </span>
          </div>
          <p className="mt-0.5 text-body-sm text-muted">{description}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border-strong px-3 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <Pencil size={13} />
          Edit
        </button>
        <Switch
          checked={enabled}
          disabled={busy}
          onCheckedChange={onToggle}
          aria-label={`Enable ${name}`}
        />
      </div>
    </div>
  );
}
