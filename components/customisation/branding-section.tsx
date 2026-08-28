'use client';

import * as React from 'react';
import {
  Upload,
  Trash2,
  Check,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CharCount } from '@/components/customisation/char-count';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsRow } from '@/components/settings/settings-row';
import { Switch } from '@/components/ui/switch';
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

function MiniThemePreview({ theme }: { theme: 'light' | 'dark' | 'auto' }) {
  const isDark = theme === 'dark';
  const isAuto = theme === 'auto';
  // Literal hexes, not tokens: this thumbnail depicts the candidate-facing
  // page in each theme, so it must show those surfaces regardless of the
  // admin's own theme. Values mirror the Geist scales in globals.css.
  const bg = isDark ? '#0a0a0a' : isAuto ? '#fafafa' : '#ffffff';
  const cardBg = isDark ? '#1a1a1a' : '#ffffff';
  const textCol = isDark ? '#ededed' : '#171717';
  const mutedCol = isDark ? '#a1a1a1' : '#4d4d4d';
  const indigo = isDark ? '#ededed' : '#171717';

  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
      <rect width="120" height="80" rx="8" fill={bg} />
      <rect x="8" y="8" width="104" height="64" rx="6" fill={cardBg} stroke={isDark ? '#2e2e2e' : '#eaeaea'} strokeOpacity="0.8" />
      <rect x="16" y="16" width="60" height="8" rx="4" fill={textCol} fillOpacity="0.8" />
      <rect x="16" y="30" width="80" height="6" rx="3" fill={mutedCol} fillOpacity="0.5" />
      <rect x="16" y="42" width="40" height="20" rx="4" fill={indigo} />
      {isAuto && (
        <>
          <circle cx="95" cy="20" r="8" fill="#F59E0B" fillOpacity="0.3" />
          <path d="M95 14v12M89 20h12" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

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
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

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

  const handleSecondaryChange = (colour: string) => {
    update({ secondaryColour: colour } as Partial<BrandingInput>);
    track('branding_updated', { field: 'secondary_colour' });
  };

  const handleColourChange = (colour: string) => {
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
          label="Company logo"
          helper="Recommended: PNG, JPG or SVG. Max size 2MB."
          control={
            <div className="flex items-center gap-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card-hover">
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
              <div className="flex flex-col gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover">
                  <Upload size={14} />
                  Change logo
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
                </label>
                {data.logoUrl && (
                  <button
                    type="button"
                    onClick={handleLogoDelete}
                    aria-label="Delete logo"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-error transition-colors hover:bg-error-banner-bg"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          }
        />
        <SettingsRow
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
          label="Brand colour"
          helper="This is your customer-facing brand colour, not the admin interface colour."
          control={
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="color"
                  value={data.primaryColour}
                  onChange={(e) => handleColourChange(e.target.value)}
                  aria-label="Colour picker"
                  className="h-10 w-10 cursor-pointer rounded-md border border-border bg-surface"
                />
              </div>
              <Input
                value={data.primaryColour}
                onChange={(e) => handleColourChange(e.target.value)}
                className="h-10 w-28 font-mono"
                aria-label="Hex colour value"
              />
            </div>
          }
        />
        <SettingsRow
          label="Secondary colour"
          helper="Used for headings and accents beside the primary button colour."
          control={
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.secondaryColour ?? '#1F242E'}
                onChange={(e) => handleSecondaryChange(e.target.value)}
                aria-label="Secondary colour picker"
                className="h-10 w-10 cursor-pointer rounded-md border border-border bg-surface"
              />
              <Input
                value={data.secondaryColour ?? '#1F242E'}
                onChange={(e) => handleSecondaryChange(e.target.value)}
                className="h-10 w-28 font-mono"
                aria-label="Secondary hex colour value"
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

      {/* Theme */}
      <SettingsSection
        title="Theme"
        description="Choose the appearance of the candidate experience."
      >
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
          {([
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'auto', label: 'Auto', icon: Monitor },
          ] as const).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                update({ theme: value } as Partial<BrandingInput>);
                track('branding_updated', { field: 'theme', value });
              }}
              aria-pressed={data.theme === value}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-4 transition-all',
                data.theme === value
                  ? 'border-primary bg-active-menu-bg shadow-sm'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <MiniThemePreview theme={value} />
              <div className="flex items-center gap-2">
                <Icon size={16} className={data.theme === value ? 'text-primary' : 'text-muted'} />
                <span className={cn('text-body font-medium', data.theme === value ? 'text-primary' : 'text-heading')}>
                  {label}
                </span>
              </div>
              {data.theme === value && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check size={12} className="text-primary-foreground" strokeWidth={3} />
                </span>
              )}
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Font */}
      <SettingsSection
        title="Font"
        description="The typeface used throughout the candidate experience."
      >
        <SettingsRow
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

      {/* Modern interface */}
      <SettingsSection
        title="Modern interface"
        description="A frosted-glass candidate interface style with depth and translucency."
      >
        <SettingsRow
          label="Frosted-glass style"
          helper="Adds subtle blur and translucency to the candidate experience."
          control={
            <Switch
              checked={data.modernInterface}
              onCheckedChange={(v) => {
                update({ modernInterface: v } as Partial<BrandingInput>);
                track('branding_updated', { field: 'modern_interface', value: v });
              }}
              aria-label="Enable frosted-glass candidate style"
            />
          }
        />
      </SettingsSection>
      {showSaveBar && <CustomisationSaveBar onSave={save} saving={saving} saved={saved} />}
    </div>
  );
}
