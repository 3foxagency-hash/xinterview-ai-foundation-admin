'use client';

import * as React from 'react';
import { Mail, MessageSquare, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsRow } from '@/components/settings/settings-row';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomisationSave } from '@/components/wizard/use-customisation-save';
import { CustomisationSaveBar } from '@/components/wizard/customisation-save-bar';
import { useRegisterSave } from '@/components/wizard/customisation-save-registry';
import { usePreviewSync } from '@/components/wizard/use-preview-sync';
import { getNotifications, saveNotifications, getPlanInfo } from '@/lib/api/jobs';
import type { NotificationsInput, ChannelSettings } from '@/lib/validation/job';
import { RichTextEditor } from '@/components/wizard/rich-text-editor';
import { track } from '@/lib/utils/analytics';

type ChannelKey = 'email' | 'sms';

export function NotificationsSection({
  scopeId,
  /**
   * The job wizard commits every section at once from its step footer, so the
   * per-section bar is hidden there. Workspace settings has no such footer and
   * keeps it.
   */
  showSaveBar = true,
}: {
  scopeId?: string;
  showSaveBar?: boolean;
}) {
  const { data, loading, update, save, saving, saved } = useCustomisationSave(
    getNotifications,
    saveNotifications,
    'notifications_updated',
    scopeId
  );

  // Lets the wizard's single Next button commit this section.
  useRegisterSave('notifications', save);
  usePreviewSync('notifications', data);
  const [plan, setPlan] = React.useState<{ emailNotifications: boolean; smsEnabled: boolean } | null>(null);
  const [smsCreditExhausted, setSmsCreditExhausted] = React.useState(false);

  React.useEffect(() => {
    getPlanInfo().then((p) => {
      setPlan({ emailNotifications: p.emailNotifications, smsEnabled: p.smsEnabled });
      // Simulate: SMS is not enabled on the plan
      setSmsCreditExhausted(false);
    }).catch(() => {});
  }, []);

  if (loading || !data) return <div className="py-8 text-center text-muted">Loading…</div>;

  const updateChannel = (channel: ChannelKey, patch: Partial<ChannelSettings>) => {
    update({ [channel]: { ...data[channel], ...patch } } as Partial<NotificationsInput>);
    track('notifications_updated', { channel, ...patch });
  };

  const renderChannelPanel = (
    channel: ChannelKey,
    label: string,
    icon: typeof Mail,
    enabled: boolean,
    creditExhausted: boolean
  ) => {
    const Icon = icon;
    const channelData = data[channel];
    const disabled = !enabled || creditExhausted;

    return (
      <SettingsSection
        title={label}
        description={
          channel === 'email'
            ? 'Send candidates email updates about their interview.'
            : 'Send candidates SMS updates about their interview.'
        }
      >
        {disabled && (
          <div className="flex items-center gap-2 bg-muted-bg px-4 py-3">
            <Lock size={14} className="text-muted" />
            <p className="text-body-sm text-muted">
              {!enabled && (
                <>
                  SMS is not included in your plan.{' '}
                  <a href="/settings/billing" className="font-medium text-primary hover:underline">
                    Upgrade to enable SMS
                  </a>
                </>
              )}
              {enabled && creditExhausted && (
                <>SMS credit is exhausted. Top up in Billing to resume sending.</>
              )}
            </p>
          </div>
        )}

        <div className={cn(disabled && 'pointer-events-none opacity-50')}>
          <SettingsRow
            label="Notify on completion"
            helper="Send a message when the candidate finishes the interview."
            control={
              <Switch
                checked={channelData.notifyOnCompletion}
                onCheckedChange={(v) => updateChannel(channel, { notifyOnCompletion: v })}
                disabled={disabled}
                aria-label={`Notify on completion via ${label}`}
              />
            }
          />
          <SettingsRow
            label="Remind if unfinished"
            helper="Send a reminder after a set number of days."
            control={
              <div className="flex items-center gap-3">
                <Switch
                  checked={channelData.remindAfterDays}
                  onCheckedChange={(v) => updateChannel(channel, { remindAfterDays: v })}
                  disabled={disabled}
                  aria-label={`Enable reminder via ${label}`}
                />
                {channelData.remindAfterDays && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={channelData.remindDays}
                      onChange={(e) => updateChannel(channel, { remindDays: parseInt(e.target.value) || 1 })}
                      min={1}
                      max={30}
                      className="h-9 w-16"
                      disabled={disabled}
                      aria-label="Days before reminder"
                    />
                    <span className="text-body-sm text-muted">days</span>
                  </div>
                )}
              </div>
            }
          />
          <SettingsRow
            label="Message on rejection"
            helper="Send a message when a candidate is rejected."
            control={
              <Switch
                checked={channelData.rejectionMessageEnabled}
                onCheckedChange={(v) => updateChannel(channel, { rejectionMessageEnabled: v })}
                disabled={disabled}
                aria-label={`Enable rejection message via ${label}`}
              />
            }
          />
          {channelData.rejectionMessageEnabled && (
            <div className="border-t border-border p-4">
              <Label className="mb-2 block text-body-sm font-semibold text-heading">Rejection message</Label>
              <p className="mb-3 text-body-sm text-muted">
                Review this wording carefully. It sends automatically when a candidate moves to Rejected.
              </p>
              <RichTextEditor
                value={channelData.rejectionMessage ?? ''}
                onChange={(val) => updateChannel(channel, { rejectionMessage: val })}
                placeholder="Write the rejection message…"
              />
            </div>
          )}
        </div>
      </SettingsSection>
    );
  };

  return (
    <div className="space-y-6">
      {renderChannelPanel('email', 'Email', Mail, true, false)}
      {renderChannelPanel(
        'sms',
        'SMS',
        MessageSquare,
        plan?.smsEnabled ?? false,
        smsCreditExhausted
      )}
      {showSaveBar && <CustomisationSaveBar onSave={save} saving={saving} saved={saved} />}
    </div>
  );
}
