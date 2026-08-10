'use client';

import * as React from 'react';
import { CharCount } from '@/components/customisation/char-count';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsRow } from '@/components/settings/settings-row';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomisationSave } from '@/components/wizard/use-customisation-save';
import { CustomisationSaveBar } from '@/components/wizard/customisation-save-bar';
import { useRegisterSave } from '@/components/wizard/customisation-save-registry';
import { getWelcomePage, saveWelcomePage } from '@/lib/api/jobs';
import type { WelcomePageInput } from '@/lib/validation/job';
import { RichTextEditor } from '@/components/wizard/rich-text-editor';
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

  if (loading || !data) return <div className="py-8 text-center text-muted">Loading…</div>;

  return (
    <div className="space-y-6">
      <SettingsSection title="Welcome page" description="The first thing candidates see when they open your interview link.">
        <SettingsRow
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
            <div className="border-t border-border px-4 py-3">
              <p className="text-body-sm text-muted">
                Adding an intro video changes the candidate landing page to a two-column layout.
              </p>
            </div>
          </>
        )}
        <SettingsRow
          label="Introduction note"
          helper="Shown before the candidate starts. They must acknowledge it to continue."
          control={
            <Switch
              checked={data.introNoteEnabled}
              onCheckedChange={(v) => {
                update({ introNoteEnabled: v } as Partial<WelcomePageInput>);
                track('welcome_page_updated', { field: 'intro_note', enabled: v });
              }}
              aria-label="Enable introduction note"
            />
          }
        />
        {data.introNoteEnabled && (
          <>
            <SettingsRow
              label="Note title"
              control={
                <>
                <Input
                  value={data.introNoteTitle ?? ''}
                  onChange={(e) => update({ introNoteTitle: e.target.value } as Partial<WelcomePageInput>)}
                  maxLength={100}
                  placeholder="Before you begin"
                  aria-label="Note title"
                />
                  <CharCount value={data.introNoteTitle ?? ''} max={100} />
                </>
              }
            />
            <div className="border-t border-border px-4 py-4">
              <Label className="mb-2 block text-body-sm font-semibold text-heading">Note body</Label>
              <RichTextEditor
                value={data.introNoteBody ?? ''}
                onChange={(val) => update({ introNoteBody: val } as Partial<WelcomePageInput>)}
                placeholder="Write the introduction candidates must acknowledge…"
              />
            </div>
          </>
        )}
      </SettingsSection>
      {showSaveBar && <CustomisationSaveBar onSave={save} saving={saving} saved={saved} />}
    </div>
  );
}
