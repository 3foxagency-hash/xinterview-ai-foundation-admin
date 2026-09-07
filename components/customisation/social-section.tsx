'use client';

import * as React from 'react';
import { Upload } from 'lucide-react';
import { CharCount } from '@/components/customisation/char-count';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsRow } from '@/components/settings/settings-row';
import { Input } from '@/components/ui/input';
import { useCustomisationSave } from '@/components/wizard/use-customisation-save';
import { CustomisationSaveBar } from '@/components/wizard/customisation-save-bar';
import { useRegisterSave } from '@/components/wizard/customisation-save-registry';
import { usePreviewSync } from '@/components/wizard/use-preview-sync';
import { getSocialPreview, saveSocialPreview } from '@/lib/api/jobs';
import {
  META_TITLE_MAX,
  META_DESCRIPTION_MAX,
  type SocialPreviewInput,
} from '@/lib/validation/job';

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
  usePreviewSync('social', data);

  if (loading || !data) return <div className="py-8 text-center text-muted">Loading…</div>;

  const domain = 'xinterview.ai';

  return (
    <div className="space-y-6">
      <SettingsSection
        description="Control how your interview link appears when shared on social media or in chat apps."
      >
        <SettingsRow
          layout="stacked"
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
          layout="stacked"
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
          layout="stacked"
          label="Meta title"
          helper="The title shown in search results and browser tabs."
          control={
            <div>
              <Input
                value={data.previewTitle ?? ''}
                onChange={(e) => update({ previewTitle: e.target.value } as Partial<SocialPreviewInput>)}
                maxLength={META_TITLE_MAX}
                placeholder="Senior Frontend Engineer — Interview"
                aria-label="Meta title"
              />
              <CharCount value={data.previewTitle ?? ''} max={META_TITLE_MAX} />
            </div>
          }
        />
        <SettingsRow
          layout="stacked"
          label="Meta description"
          helper="A brief summary shown in search results."
          control={
            <div>
              <textarea
                value={data.previewDescription ?? ''}
                onChange={(e) =>
                  update({ previewDescription: e.target.value } as Partial<SocialPreviewInput>)
                }
                maxLength={META_DESCRIPTION_MAX}
                rows={3}
                placeholder="Apply in minutes with a short video interview."
                aria-label="Meta description"
                className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-body text-heading placeholder:text-muted transition-colors hover:border-border-strong"
              />
              <CharCount value={data.previewDescription ?? ''} max={META_DESCRIPTION_MAX} />
            </div>
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
              <p className="mt-0.5 line-clamp-2 text-caption text-muted">
                {data.previewDescription || 'Your description appears here.'}
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>
      {showSaveBar && <CustomisationSaveBar onSave={save} saving={saving} saved={saved} />}
    </div>
  );
}
