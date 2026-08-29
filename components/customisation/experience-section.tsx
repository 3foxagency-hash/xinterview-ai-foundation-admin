'use client';

import * as React from 'react';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsRow } from '@/components/settings/settings-row';
import { Switch } from '@/components/ui/switch';
import { useCustomisationSave } from '@/components/wizard/use-customisation-save';
import { CustomisationSaveBar } from '@/components/wizard/customisation-save-bar';
import { useRegisterSave } from '@/components/wizard/customisation-save-registry';
import { usePreviewSync } from '@/components/wizard/use-preview-sync';
import { getInterviewExperience, saveInterviewExperience } from '@/lib/api/jobs';
import type { InterviewExperienceInput } from '@/lib/validation/job';
import { track } from '@/lib/utils/analytics';

export function ExperienceSection({
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
    getInterviewExperience,
    saveInterviewExperience,
    'integrity_settings_updated',
    scopeId
  );

  // Lets the wizard's single Next button commit this section.
  useRegisterSave('experience', save);
  usePreviewSync('experience', data);

  if (loading || !data) return <div className="py-8 text-center text-muted">Loading…</div>;

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Interview experience"
        description="Control what candidates experience during the interview and how integrity is enforced."
      >
        <SettingsRow
          label="Tab switch detection"
          helper="Candidates are flagged if they switch away from the interview tab."
          control={
            <Switch
              checked={data.tabSwitchDetection}
              onCheckedChange={(v) => {
                update({ tabSwitchDetection: v } as Partial<InterviewExperienceInput>);
                track('integrity_settings_updated', { setting: 'tab_switch', enabled: v });
              }}
              aria-label="Enable tab switch detection"
            />
          }
        />
        <SettingsRow
          label="Disable copy and paste"
          helper="Prevents candidates from pasting text into their responses."
          control={
            <Switch
              checked={data.disableCopyPaste}
              onCheckedChange={(v) => {
                update({ disableCopyPaste: v } as Partial<InterviewExperienceInput>);
                track('integrity_settings_updated', { setting: 'copy_paste', enabled: v });
              }}
              aria-label="Disable copy and paste"
            />
          }
        />
        <SettingsRow
          label="Enforce full screen"
          helper="Requires candidates to remain in full-screen mode for the duration of the interview."
          control={
            <Switch
              checked={data.enforceFullScreen}
              onCheckedChange={(v) => {
                update({ enforceFullScreen: v } as Partial<InterviewExperienceInput>);
                track('integrity_settings_updated', { setting: 'full_screen', enabled: v });
              }}
              aria-label="Enforce full screen"
            />
          }
        />

      </SettingsSection>
      {showSaveBar && <CustomisationSaveBar onSave={save} saving={saving} saved={saved} />}
    </div>
  );
}
