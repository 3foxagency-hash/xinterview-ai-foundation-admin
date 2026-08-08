'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsRow } from '@/components/settings/settings-row';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCustomisationSave } from '@/components/wizard/use-customisation-save';
import { CustomisationSaveBar } from '@/components/wizard/customisation-save-bar';
import { useRegisterSave } from '@/components/wizard/customisation-save-registry';
import { getInterviewExperience, saveInterviewExperience } from '@/lib/api/jobs';
import type { InterviewExperienceInput } from '@/lib/validation/job';
import { RichTextEditor } from '@/components/wizard/rich-text-editor';
import { track } from '@/lib/utils/analytics';

const DISCLOSURE_TEXT = 'Your session is monitored for interview integrity.';

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

  if (loading || !data) return <div className="py-8 text-center text-muted">Loading…</div>;

  const anyIntegrityOn =
    data.tabSwitchDetection || data.disableCopyPaste || data.enforceFullScreen;

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

        {anyIntegrityOn && (
          <div className="border-t border-border bg-active-menu-bg/30 px-4 py-4">
            <div className="flex items-start gap-2">
              <Info size={16} className="mt-0.5 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-body-sm font-medium text-heading">Candidate disclosure</p>
                <p className="mt-1 text-body-sm text-muted">
                  Candidates will see this message before starting. It cannot be turned off independently.
                </p>
                <div
                  className="mt-3 rounded-md border border-border bg-surface px-4 py-3 text-body-sm italic text-bodyText"
                  aria-readonly
                >
                  {DISCLOSURE_TEXT}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-border p-4">
          <Label className="mb-2 block text-body-sm font-semibold text-heading">
            Instructions for candidates
          </Label>
          <RichTextEditor
            value={data.candidateInstructions ?? ''}
            onChange={(val) => update({ candidateInstructions: val } as Partial<InterviewExperienceInput>)}
            placeholder="Optional instructions shown to candidates before they begin…"
          />
        </div>
      </SettingsSection>
      {showSaveBar && <CustomisationSaveBar onSave={save} saving={saving} saved={saved} />}
    </div>
  );
}
