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
import { usePreviewSync } from '@/components/wizard/use-preview-sync';
import { getWelcomePage, saveWelcomePage } from '@/lib/api/jobs';
import type { WelcomePageInput } from '@/lib/validation/job';
import { RichTextEditor } from '@/components/wizard/rich-text-editor';
import { track } from '@/lib/utils/analytics';

/**
 * The intro note candidates must acknowledge before starting. Lives on the
 * same `welcomePage` record as the rest of the welcome page — split into its
 * own section/tab because it is its own decision (require an acknowledgement
 * or not) rather than part of "what the landing page looks like".
 */
export function IntroNoteSection({
  scopeId,
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

  useRegisterSave('intro-note', save);
  usePreviewSync('welcome', data);

  if (loading || !data) return <div className="py-8 text-center text-muted">Loading…</div>;

  return (
    <div className="space-y-6">
      <SettingsSection
        bordered={false}
        title="Introduction note"
        description="Shown before the candidate starts. They must acknowledge it to continue."
      >
        <SettingsRow
          layout="stacked"
          label="Introduction note"
          helper="Turn this on to require an acknowledgement before the interview starts."
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
              layout="stacked"
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
