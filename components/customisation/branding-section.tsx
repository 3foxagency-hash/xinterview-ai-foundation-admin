'use client';

import * as React from 'react';
import { Upload, Trash2, Check, TriangleAlert as AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CharCount } from '@/components/customisation/char-count';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsRow } from '@/components/settings/settings-row';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useCustomisationSave } from '@/components/wizard/use-customisation-save';
import { CustomisationSaveBar } from '@/components/wizard/customisation-save-bar';
import { useRegisterSave } from '@/components/wizard/customisation-save-registry';
import { usePreviewSync } from '@/components/wizard/use-preview-sync';
import { getBranding, saveBranding } from '@/lib/api/jobs';
import type { BrandingInput } from '@/lib/validation/job';
import { track } from '@/lib/utils/analytics';
import { toast } from 'sonner';

const COLOUR_PRESETS = [
  '#5B4FE9', '#2563EB', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6', '#F97316',
];

const FONTS = [
  { value: 'inter', label: 'Inter', family: 'Inter, sans-serif' },
  { value: 'roboto', label: 'Roboto', family: 'Roboto, sans-serif' },
  { value: 'opendyslexic', label: 'OpenDyslexic', family: 'OpenDyslexic, sans-serif' },
  { value: 'lato', label: 'Lato', family: 'Lato, sans-serif' },
  { value: 'poppins', label: 'Poppins', family: 'Poppins, sans-serif' },
  { value: 'sourcesans', label: 'Source Sans Pro', family: 'Source Sans Pro, sans-serif' },
];

export function BrandingSection({
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
    getBranding,
    saveBranding,
    'branding_updated',
    scopeId
  );

  // Lets the wizard's single Next button commit this section.
  useRegisterSave('branding', save);
  usePreviewSync('branding', data);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [hexError, setHexError] = React.useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  // These must run on every render regardless of loading state — hooks
  // below an early return change the hook count between renders and throw
  // "Rendered more hooks than during the previous render." `data` is only
  // possibly null while loading, so each falls back to the same default
  // primary colour used by "Reset to default" below.
  const primaryColour = data?.primaryColour ?? '#5B4FE9';

  const contrastPasses = React.useMemo(() => {
    const hex = primaryColour.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.35 || luminance < 0.15 ? false : true;
  }, [primaryColour]);

  const autoCorrectedColour = React.useMemo(() => {
    const hex = primaryColour.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (luminance < 0.15) {
      const adjust = (c: number) => Math.min(255, Math.round(c + (255 - c) * 0.7));
      return `#${adjust(r).toString(16).padStart(2, '0')}${adjust(g).toString(16).padStart(2, '0')}${adjust(b).toString(16).padStart(2, '0')}`.toUpperCase();
    }
    if (luminance > 0.85) {
      const adjust = (c: number) => Math.max(0, Math.round(c * 0.5));
      return `#${adjust(r).toString(16).padStart(2, '0')}${adjust(g).toString(16).padStart(2, '0')}${adjust(b).toString(16).padStart(2, '0')}`.toUpperCase();
    }
    return primaryColour;
  }, [primaryColour]);

  if (loading || !data) {
    return <div className="py-8 text-center text-muted">Loading…</div>;
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
      setUploadError('Please upload a PNG, JPG or SVG file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 2MB.');
      return;
    }

    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          const url = URL.createObjectURL(file);
          update({ logoUrl: url } as Partial<BrandingInput>);
          track('branding_updated', { field: 'logo' });
          return null;
        }
        return prev + 10;
      });
    }, 80);
  };

  const handleLogoDelete = () => {
    update({ logoUrl: '' } as Partial<BrandingInput>);
    track('branding_updated', { field: 'logo_removed' });
  };

  const handleColourChange = (colour: string) => {
    const hexRe = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRe.test(colour)) {
      setHexError('Enter a valid hex colour, e.g. #5B4FE9.');
      return;
    }
    setHexError(null);
    update({ primaryColour: colour } as Partial<BrandingInput>);
    track('branding_updated', { field: 'primary_colour' });
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <SettingsSection
        title="Logo"
        description="Your logo appears on the candidate landing page and throughout the interview."
      >
        <SettingsRow
          layout="stacked"
          label="Company logo"
          helper="Recommended: PNG, JPG or SVG. Max size 2MB."
          control={
            <div className="flex flex-col gap-3">
              <div className="relative flex h-16 w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-card-hover">
                {data.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.logoUrl} alt="Logo preview" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-caption text-muted">No logo</span>
                )}
                {uploadProgress !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface/80">
                    <div className="h-1 w-10 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-button text-heading transition-colors hover:bg-card-hover">
                  <Upload size={14} />
                  Change logo
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
                </label>
                {data.logoUrl && (
                  <button
                    type="button"
                    onClick={handleLogoDelete}
                    aria-label="Delete logo"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-error transition-colors hover:bg-error-banner-bg"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          }
        />
        <SettingsRow
          layout="stacked"
          label="Company title"
          helper="Shown beside your logo on candidate-facing pages."
          control={
            <>
            <Input
              value={data.companyTitle ?? ''}
              onChange={(e) => {
                update({ companyTitle: e.target.value } as Partial<BrandingInput>);
                track('branding_updated', { field: 'company_title' });
              }}
              maxLength={60}
              placeholder="Your company"
              className="h-10 w-full"
              aria-label="Company title"
            />
              <CharCount value={data.companyTitle ?? ''} max={60} />
            </>
          }
        />
        {uploadError && (
          <div className="border-t border-border px-4 py-3">
            <p role="alert" className="flex items-center gap-2 text-body-sm text-error">
              <AlertTriangle size={14} />
              {uploadError}
            </p>
          </div>
        )}
      </SettingsSection>

      {/* Primary colour */}
      <SettingsSection
        title="Primary colour"
        description="Your brand colour, used on buttons and accents throughout the candidate experience."
      >
        <SettingsRow
          layout="stacked"
          label="Brand colour"
          helper="This is your customer-facing brand colour, not the admin interface colour."
          control={
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.primaryColour}
                onChange={(e) => handleColourChange(e.target.value)}
                aria-label="Colour picker"
                className="h-10 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-surface"
              />
              <Input
                value={data.primaryColour}
                onChange={(e) => handleColourChange(e.target.value)}
                className="h-10 min-w-0 flex-1 font-mono"
                aria-label="Hex colour value"
              />
            </div>
          }
        />
        <div className="border-t border-border px-4 py-4">
          <p className="mb-3 text-body-sm text-muted">Preset colours</p>
          <div className="flex flex-wrap gap-2">
            {COLOUR_PRESETS.map((colour) => (
              <button
                key={colour}
                type="button"
                onClick={() => handleColourChange(colour)}
                aria-label={`Select ${colour}`}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all hover:scale-110',
                  data.primaryColour.toUpperCase() === colour.toUpperCase()
                    ? 'border-heading'
                    : 'border-transparent'
                )}
                style={{ backgroundColor: colour }}
              >
                {data.primaryColour.toUpperCase() === colour.toUpperCase() && (
                  <Check size={14} className="text-white" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Font */}
      <SettingsSection
        title="Font"
        description="The typeface used throughout the candidate experience."
      >
        <SettingsRow
          layout="stacked"
          label="Candidate font"
          helper="Each option is shown in its own typeface."
          control={
            <Select
              value={data.font}
              onValueChange={(v) => {
                update({ font: v as BrandingInput['font'] } as Partial<BrandingInput>);
                track('branding_updated', { field: 'font', value: v });
              }}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((font) => (
                  <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.family }}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </SettingsSection>

      {/* Contrast warning */}
      {!contrastPasses && (
        <div className="rounded-lg border border-warning-border bg-warning-wash px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
            <div className="flex-1">
              <p className="text-body-sm font-medium text-heading">
                Text on this colour may be hard to read.
              </p>
              <p className="mt-1 text-body-sm text-muted">
                The button text on your candidate landing page could fail accessibility contrast.{' '}
                <button
                  type="button"
                  onClick={() => handleColourChange(autoCorrectedColour)}
                  className="font-medium text-primary hover:underline"
                >
                  Use {autoCorrectedColour} instead
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reset to default */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-4 py-3">
        <div>
          <p className="text-body-sm font-medium text-heading">Reset branding</p>
          <p className="text-body-sm text-muted">Restore the default logo, colour and font.</p>
        </div>
        {showResetConfirm ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                update({
                  logoUrl: '',
                  primaryColour: '#5B4FE9',
                  theme: 'auto',
                  font: 'inter',
                } as Partial<BrandingInput>);
                setShowResetConfirm(false);
              }}
              className="flex-1 rounded-md bg-error px-3 py-1.5 text-body-sm text-error-foreground transition-colors hover:bg-error-active"
            >
              Confirm reset
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="flex-1 rounded-md border border-border-strong px-3 py-1.5 text-body-sm text-heading transition-colors hover:bg-card-hover"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="w-full rounded-md border border-border-strong px-3 py-1.5 text-body-sm text-heading transition-colors hover:bg-card-hover"
          >
            Reset to default
          </button>
        )}
      </div>

      {hexError && (
        <p role="alert" className="text-body-sm text-error">{hexError}</p>
      )}
      {showSaveBar && <CustomisationSaveBar onSave={save} saving={saving} saved={saved} />}
    </div>
  );
}
