'use client';

import * as React from 'react';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsRow } from '@/components/settings/settings-row';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomisationSave } from '@/components/wizard/use-customisation-save';
import { CustomisationSaveBar } from '@/components/wizard/customisation-save-bar';
import { getThankYouPage, saveThankYouPage } from '@/lib/api/jobs';
import type { ThankYouPageInput } from '@/lib/validation/job';
import { RichTextEditor } from '@/components/wizard/rich-text-editor';

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return url;
  }
}

export default function ThankYouPageSection() {
  const { data, loading, update, save, saving, saved } = useCustomisationSave(
    getThankYouPage,
    saveThankYouPage
  );

  if (loading || !data) return <div className="py-8 text-center text-muted">Loading…</div>;

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Thank you page"
        description="What candidates see after completing their interview."
      >
        <div className="border-b border-border p-4">
          <Label
            htmlFor="thank-you-title"
            className="mb-2 block text-body-sm font-semibold text-heading"
          >
            Title
          </Label>
          <Input
            id="thank-you-title"
            value={data.title ?? ''}
            onChange={(e) => update({ title: e.target.value } as Partial<ThankYouPageInput>)}
            maxLength={50}
            placeholder="Interview Complete"
          />
          <p className="mt-1.5 text-body-sm text-muted">
            The heading candidates see on the completion screen.
          </p>
        </div>

        <div className="border-b border-border p-4">
          <Label className="mb-2 block text-body-sm font-semibold text-heading">Completion message</Label>
          <RichTextEditor
            value={data.completionMessage}
            onChange={(val) => update({ completionMessage: val } as Partial<ThankYouPageInput>)}
            placeholder="Thank candidates for their time…"
          />
        </div>

        <SettingsRow
          label="Redirect"
          helper="Send candidates to a URL after they finish."
          control={
            <Switch
              checked={data.redirectEnabled}
              onCheckedChange={(v) => update({ redirectEnabled: v } as Partial<ThankYouPageInput>)}
              aria-label="Enable redirect"
            />
          }
        />
        {data.redirectEnabled && (
          <>
            <SettingsRow
              label="Redirect URL"
              control={
                <Input
                  value={data.redirectUrl ?? ''}
                  onChange={(e) => update({ redirectUrl: e.target.value } as Partial<ThankYouPageInput>)}
                  placeholder="https://yourcompany.com/careers"
                  aria-label="Redirect URL"
                />
              }
            />
            <SettingsRow
              label="Delay"
              helper="Seconds before redirecting."
              control={
                <Input
                  type="number"
                  value={data.redirectDelay}
                  onChange={(e) => update({ redirectDelay: parseInt(e.target.value) || 0 } as Partial<ThankYouPageInput>)}
                  min={0}
                  max={30}
                  className="h-10 w-24"
                  aria-label="Redirect delay in seconds"
                />
              }
            />
            {data.redirectUrl && (
              <div className="border-t border-border px-4 py-3">
                <p className="text-body-sm text-muted">
                  Candidates will be sent to{' '}
                  <span className="font-medium text-heading">{extractDomain(data.redirectUrl)}</span>{' '}
                  {data.redirectDelay} second{data.redirectDelay !== 1 ? 's' : ''} after finishing.
                </p>
              </div>
            )}
          </>
        )}
      </SettingsSection>
      <CustomisationSaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}
