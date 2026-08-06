'use client';

import * as React from 'react';
import { ExternalLink, Upload, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsPage } from '@/components/settings';
import { SettingsSection } from '@/components/settings/settings-section';
import { SettingsRow } from '@/components/settings/settings-row';
import { SaveBar } from '@/components/settings/save-bar';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { CopyField } from '@/components/settings/copy-field';
import { CareerListingsDialog } from '@/components/settings/career-listings-dialog';
import { CareerSkeleton } from '@/components/settings/career-skeleton';
import { RichTextEditor } from '@/components/wizard/rich-text-editor';
import {
  getCareerPage,
  saveCareerPage,
  getCareerEmbedCode,
  getCareerPageUrl,
  getOrganization,
  CAREER_META_TITLE_MAX,
  CAREER_META_DESCRIPTION_MAX,
  type CareerPageConfig,
  type CareerJobListing,
} from '@/lib/api/settings';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

const PRESET_COLOURS = ['#5B4FE9', '#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444'];

export default function CareerPage() {
  const [config, setConfig] = React.useState<CareerPageConfig | null>(null);
  const [initial, setInitial] = React.useState<CareerPageConfig | null>(null);
  const [companyName, setCompanyName] = React.useState<string>();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);
  const [listingsOpen, setListingsOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, org] = await Promise.all([getCareerPage(), getOrganization()]);
        if (cancelled) return;
        setConfig(c);
        setInitial(c);
        setCompanyName(org.name);
      } catch (e) {
        if (!cancelled) toast.error(getSettingsErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof CareerPageConfig>(key: K, value: CareerPageConfig[K]) => {
    setConfig((c) => (c ? { ...c, [key]: value } : c));
    setJustSaved(false);
  };

  const isDirty = React.useMemo(
    () => !!config && !!initial && JSON.stringify(config) !== JSON.stringify(initial),
    [config, initial]
  );

  const metaTitleOver = (config?.metaTitle.length ?? 0) > CAREER_META_TITLE_MAX;
  const metaDescOver = (config?.metaDescription.length ?? 0) > CAREER_META_DESCRIPTION_MAX;

  const handleSave = async () => {
    if (!config) return;
    if (metaTitleOver || metaDescOver) {
      toast.error('Shorten your SEO fields before saving.');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveCareerPage(config);
      setConfig(saved);
      setInitial(saved);
      setJustSaved(true);
      toast.success('Careers page updated');
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (initial) setConfig(initial);
    setJustSaved(false);
  };

  if (loading || !config) return <CareerSkeleton />;

  const visibleCount = config.listings.filter((l) => l.visible && !l.expired).length;

  return (
    <>
      <SettingsPage
        title="Careers page"
        scope="company"
        companyName={companyName}
        description="Showcase every job opening in one place, so candidates can apply from a single link."
      >
        {/* ── Share ── */}
        <SettingsSection
          title="Share your page"
          description="Embed the page on your website or share the link directly."
        >
          <div className="flex flex-col gap-4 p-4">
            <CopyField
              label="Embed code"
              value={getCareerEmbedCode()}
              helper="Paste this into your site and your careers page is live."
            />
            <CopyField label="Direct link" value={getCareerPageUrl()} />
            <a
              href={getCareerPageUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-border-strong px-4 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <ExternalLink size={14} />
              Preview page
            </a>
          </div>
        </SettingsSection>

        {/* ── Branding ── */}
        <SettingsSection
          title="Branding"
          description="How your careers page looks to candidates."
        >
          <SettingsRow
            label="Show logo"
            helper="Display your company logo at the top of the page."
            control={
              <Switch
                checked={config.showLogo}
                onCheckedChange={(v) => update('showLogo', v)}
                aria-label="Show logo on the careers page"
              />
            }
          />
          <SettingsRow
            label="Button colour"
            helper="Used on Apply buttons and links."
            control={<ColourPicker value={config.buttonColor} onChange={(v) => update('buttonColor', v)} />}
          />
          <SettingsRow
            label="Secondary colour"
            helper="Used for headings and accents."
            control={
              <ColourPicker
                value={config.secondaryColor}
                onChange={(v) => update('secondaryColor', v)}
              />
            }
          />
        </SettingsSection>

        {/* ── Content ── */}
        <SettingsSection
          title="Page content"
          description="What candidates read when they land on your page."
        >
          <div className="border-b border-border p-4">
            <label className="mb-1.5 block text-body-sm font-medium text-heading">
              Welcome message
            </label>
            <p className="mb-2 text-body-sm text-muted">
              Introduce your company and the opportunities on offer.
            </p>
            <RichTextEditor
              value={config.welcomeMessage}
              onChange={(v) => update('welcomeMessage', v)}
              placeholder="Careers at your company…"
            />
          </div>

          <div className="p-4">
            <label className="mb-1.5 block text-body-sm font-medium text-heading">
              Thank you note
            </label>
            <p className="mb-2 text-body-sm text-muted">
              Shown after someone applies — thank them and set expectations.
            </p>
            <RichTextEditor
              value={config.thankYouNote}
              onChange={(v) => update('thankYouNote', v)}
              placeholder="Thanks for your interest…"
            />
          </div>
        </SettingsSection>

        {/* ── Listings ── */}
        <SettingsSection
          title="Job listings"
          description="Choose which openings appear on the page."
        >
          <SettingsRow
            label="Featured jobs"
            helper={`${visibleCount} of ${config.listings.length} job${
              config.listings.length === 1 ? '' : 's'
            } shown. Only active jobs appear; expired ones are hidden automatically.`}
            control={
              <button
                type="button"
                onClick={() => setListingsOpen(true)}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface md:w-auto"
              >
                <ListChecks size={15} />
                Manage listings
              </button>
            }
          />
        </SettingsSection>

        {/* ── SEO ── */}
        <SettingsSection
          title="SEO & social preview"
          description="How your page appears in search results and when shared."
        >
          <SettingsRow
            label="Favicon"
            helper="Shown in browser tabs. Recommended 32×32px."
            control={
              <label className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover md:w-auto">
                <Upload size={14} />
                Upload favicon
                <input type="file" accept="image/png,image/x-icon" className="hidden" onChange={() => {}} />
              </label>
            }
          />
          <SettingsRow
            label="Preview image"
            helper="Shown when your link is shared. Recommended 1200×630px."
            control={
              <label className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover md:w-auto">
                <Upload size={14} />
                Upload image
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={() => {}} />
              </label>
            }
          />

          <div className="border-t border-border p-4">
            <label htmlFor="meta-title" className="mb-1.5 block text-body-sm font-medium text-heading">
              Meta title
            </label>
            <Input
              id="meta-title"
              value={config.metaTitle}
              onChange={(e) => update('metaTitle', e.target.value)}
              aria-invalid={metaTitleOver}
              aria-describedby="meta-title-count"
              className={cn(metaTitleOver && 'border-error')}
            />
            <div className="mt-1.5 flex items-baseline justify-between gap-3">
              <p className="text-body-sm text-muted">
                The title shown in search results and browser tabs.
              </p>
              <span
                id="meta-title-count"
                className={cn(
                  'shrink-0 text-body-sm tabular-nums',
                  metaTitleOver ? 'font-medium text-error' : 'text-muted'
                )}
              >
                {config.metaTitle.length}/{CAREER_META_TITLE_MAX}
              </span>
            </div>
          </div>

          <div className="border-t border-border p-4">
            <label
              htmlFor="meta-description"
              className="mb-1.5 block text-body-sm font-medium text-heading"
            >
              Meta description
            </label>
            <textarea
              id="meta-description"
              rows={3}
              value={config.metaDescription}
              onChange={(e) => update('metaDescription', e.target.value)}
              aria-invalid={metaDescOver}
              aria-describedby="meta-description-count"
              className={cn(
                'w-full rounded-md border bg-background px-3 py-2 text-body text-heading placeholder:text-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10',
                metaDescOver
                  ? 'border-error'
                  : 'border-border hover:border-border-strong focus-visible:border-primary'
              )}
            />
            <div className="mt-1.5 flex items-baseline justify-between gap-3">
              <p className="text-body-sm text-muted">
                A brief summary shown in search results.
              </p>
              <span
                id="meta-description-count"
                className={cn(
                  'shrink-0 text-body-sm tabular-nums',
                  metaDescOver ? 'font-medium text-error' : 'text-muted'
                )}
              >
                {config.metaDescription.length}/{CAREER_META_DESCRIPTION_MAX}
              </span>
            </div>
            {metaDescOver && (
              <p role="alert" className="mt-1 text-body-sm text-error">
                Search engines will truncate this. Trim it to {CAREER_META_DESCRIPTION_MAX}{' '}
                characters.
              </p>
            )}
          </div>
        </SettingsSection>
      </SettingsPage>

      <SaveBar
        visible={isDirty}
        loading={saving}
        saved={justSaved}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />

      <CareerListingsDialog
        open={listingsOpen}
        onOpenChange={setListingsOpen}
        listings={config.listings}
        onChange={(l: CareerJobListing[]) => update('listings', l)}
      />
    </>
  );
}

/** Preset swatches plus a native colour input for anything else. */
function ColourPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESET_COLOURS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`Use ${c}`}
          aria-pressed={value.toLowerCase() === c.toLowerCase()}
          style={{ backgroundColor: c }}
          className={cn(
            'h-7 w-7 rounded-full border transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
            value.toLowerCase() === c.toLowerCase()
              ? 'scale-110 border-heading'
              : 'border-border hover:scale-105'
          )}
        />
      ))}
      <label className="inline-flex items-center gap-2">
        <span className="sr-only">Custom colour</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded-md border border-border bg-background p-0.5"
        />
      </label>
      <code className="text-body-sm uppercase text-muted">{value}</code>
    </div>
  );
}
