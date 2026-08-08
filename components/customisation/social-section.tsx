'use client';

import * as React from 'react';
import { Upload } from 'lucide-react';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsRow } from '@/components/settings/settings-row';
import { Input } from '@/components/ui/input';
import { useCustomisationSave } from '@/components/wizard/use-customisation-save';
import { CustomisationSaveBar } from '@/components/wizard/customisation-save-bar';
import { useRegisterSave } from '@/components/wizard/customisation-save-registry';
import { getSocialPreview, saveSocialPreview } from '@/lib/api/jobs';
import type { SocialPreviewInput } from '@/lib/validation/job';

export function SocialSection({
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
    getSocialPreview,
    saveSocialPreview,
    undefined,
    scopeId
  );

  // Lets the wizard's single Next button commit this section.
  useRegisterSave('social', save);

  if (loading || !data) return <div className="py-8 text-center text-muted">Loading…</div>;

  const domain = 'xinterview.ai';

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Social preview"
        description="Control how your interview link appears when shared on social media or in chat apps."
      >
        <SettingsRow
          label="Favicon"
          helper="Recommended: 32×32px PNG or ICO."
          control={
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover">
              <Upload size={14} />
              Upload favicon
              <input type="file" accept="image/png,image/x-icon" className="hidden" onChange={() => {}} />
            </label>
          }
        />
        <SettingsRow
          label="Share image"
          helper="Recommended: 1200×630px PNG or JPG."
          control={
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover">
              <Upload size={14} />
              Upload image
              <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={() => {}} />
            </label>
          }
        />
        <SettingsRow
          label="Preview title"
          helper="The title shown in link previews."
          control={
            <Input
              value={data.previewTitle ?? ''}
              onChange={(e) => update({ previewTitle: e.target.value } as Partial<SocialPreviewInput>)}
              maxLength={120}
              placeholder="Senior Frontend Engineer — Interview"
              aria-label="Preview title"
            />
          }
        />

        {/* Mock link card */}
        <div className="border-t border-border p-4">
          <p className="mb-3 text-body-sm font-medium text-heading">Link preview</p>
          <div className="overflow-hidden rounded-lg border border-border shadow-sm" style={{ maxWidth: 400 }}>
            <div className="flex h-[160px] items-center justify-center bg-card-hover">
              {data.shareImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.shareImageUrl} alt="Share preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-body-sm text-muted">1200 × 630</span>
              )}
            </div>
            <div className="p-3">
              <p className="text-caption uppercase text-muted">{domain}</p>
              <p className="mt-1 text-body-sm font-medium text-heading">
                {data.previewTitle || 'Your preview title appears here'}
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>
      {showSaveBar && <CustomisationSaveBar onSave={save} saving={saving} saved={saved} />}
    </div>
  );
}
