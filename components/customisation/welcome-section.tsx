'use client';

import * as React from 'react';
import { CharCount } from '@/components/customisation/char-count';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsRow } from '@/components/settings/settings-row';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useCustomisationSave } from '@/components/wizard/use-customisation-save';
import { CustomisationSaveBar } from '@/components/wizard/customisation-save-bar';
import { useRegisterSave } from '@/components/wizard/customisation-save-registry';
import { usePreviewSync } from '@/components/wizard/use-preview-sync';
import { getWelcomePage, saveWelcomePage } from '@/lib/api/jobs';
import type { WelcomePageInput } from '@/lib/validation/job';
import { track } from '@/lib/utils/analytics';

export function WelcomeSection({
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
    getWelcomePage,
    saveWelcomePage,
    'welcome_page_updated',
    scopeId
  );

  // Lets the wizard's single Next button commit this section.
  useRegisterSave('welcome', save);
  usePreviewSync('welcome', data);

  if (loading || !data) return <div className="py-8 text-center text-muted">Loading…</div>;

  return (
    <div className="space-y-6">
      <SettingsSection description="The first thing candidates see when they open your interview link.">
        <SettingsRow
          layout="stacked"
          label="Headline"
          helper="The main heading on the landing page."
          control={
            <div>
              <Input
                value={data.headline}
                onChange={(e) => {
                  if (e.target.value.length <= 50) {
                    update({ headline: e.target.value } as Partial<WelcomePageInput>);
                    track('welcome_page_updated', { field: 'headline' });
                  }
                }}
                maxLength={50}
                placeholder="Welcome to your interview"
                aria-label="Headline"
              />
              <CharCount value={data.headline ?? ''} max={50} />
            </div>
          }
        />
        <SettingsRow
          layout="stacked"
          label="Subtitle"
          helper="A supporting line beneath the headline."
          control={
            <div>
              <Input
                value={data.subtitle ?? ''}
                onChange={(e) => {
                  if (e.target.value.length <= 150) {
                    update({ subtitle: e.target.value } as Partial<WelcomePageInput>);
                  }
                }}
                maxLength={150}
                placeholder="We're excited to learn more about you"
                aria-label="Subtitle"
              />
              <CharCount value={data.subtitle ?? ''} max={150} />
            </div>
          }
        />
        <SettingsRow
          layout="stacked"
          label="Estimated time"
          helper="Shown to candidates before they start."
          control={
            <Input
              type="number"
              value={data.estimatedTime}
              onChange={(e) => {
                update({ estimatedTime: parseInt(e.target.value) || 0 } as Partial<WelcomePageInput>);
              }}
              min={1}
              max={120}
              className="h-10 w-28"
              aria-label="Estimated time in minutes"
            />
          }
        />
        <SettingsRow
          layout="stacked"
          label="Intro video"
          helper="Embed a short video introducing the role or company."
          control={
            <Switch
              checked={data.introVideoEnabled}
              onCheckedChange={(v) => {
                update({ introVideoEnabled: v } as Partial<WelcomePageInput>);
                track('welcome_page_updated', { field: 'intro_video', enabled: v });
              }}
              aria-label="Enable intro video"
            />
          }
        />
        {data.introVideoEnabled && (
          <>
            <SettingsRow
              layout="stacked"
              label="Video URL"
              helper="A public YouTube or Vimeo link."
              control={
                <Input
                  value={data.introVideoUrl ?? ''}
                  onChange={(e) => update({ introVideoUrl: e.target.value } as Partial<WelcomePageInput>)}
                  placeholder="https://youtube.com/watch?v=…"
                  aria-label="Video URL"
                />
              }
            />
            {data.introVideoEnabled && !data.introVideoUrl && (
              <div className="border-t border-border px-4 py-3">
                <p role="alert" className="text-body-sm text-error">
                  Add a video link, or turn the intro video off.
                </p>
              </div>
            )}
          </>
        )}
        <SettingsRow
          layout="stacked"
          label="Show estimated time"
          helper="Displays the estimated interview duration on the landing page."
          control={
            <Switch
              checked={data.estimatedTime > 0}
              onCheckedChange={(v) => update({ estimatedTime: v ? 15 : 0 } as Partial<WelcomePageInput>)}
              aria-label="Show estimated time to candidates"
            />
          }
        />
      </SettingsSection>
      {showSaveBar && <CustomisationSaveBar onSave={save} saving={saving} saved={saved} />}
    </div>
  );
}
