'use client';

import * as React from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  ListChecks,
  Search,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsPage } from '@/components/settings';
import { SaveBar } from '@/components/settings/save-bar';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
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

  if (loading || !config) return <CareerSkeleton />;

  const visibleCount = config.listings.filter((l) => l.visible && !l.expired).length;
  const activeCount = config.listings.filter((l) => !l.expired).length;

  return (
    <>
      <SettingsPage
        title="Careers page"
        scope="company"
        companyName={companyName}
        description="One public page listing every opening, so candidates can apply from a single link."
      >
        {/* ── Live status + share, the two things you came here to do ── */}
        <section className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="bg-hero-gradient px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/80 px-2.5 py-1 text-caption font-medium text-heading backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                  Page is live
                </span>
                <h2 className="mt-2.5 truncate text-h2 text-heading">
                  {companyName ?? 'Your company'} careers
                </h2>
                <p className="mt-1 text-body-sm text-bodyText">
                  {visibleCount} of {activeCount} active {activeCount === 1 ? 'job' : 'jobs'}{' '}
                  showing publicly.
                </p>
              </div>

              <a
                href={getCareerPageUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-fit shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <ExternalLink size={15} />
                View live page
              </a>
            </div>
          </div>

          <div className="grid gap-4 border-t border-border px-5 py-5 sm:grid-cols-2 sm:px-6">
            <ShareField label="Direct link" value={getCareerPageUrl()} icon={Globe} />
            <ShareField label="Embed code" value={getCareerEmbedCode()} icon={Copy} mono />
          </div>
        </section>

        {/* ── Appearance, with a preview that reflects the choices live ── */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-h3 text-heading">Appearance</h2>
          <p className="mt-1 text-body-sm text-muted">
            Colours apply to buttons, links and headings on your page.
          </p>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
            <div className="min-w-0 space-y-5">
              <label className="flex items-center justify-between gap-4">
                <span className="min-w-0">
                  <span className="block text-body-sm font-medium text-heading">Show logo</span>
                  <span className="mt-0.5 block text-body-sm text-muted">
                    Display your company logo at the top of the page.
                  </span>
                </span>
                <Switch
                  checked={config.showLogo}
                  onCheckedChange={(v) => update('showLogo', v)}
                  aria-label="Show logo on the careers page"
                />
              </label>

              <ColourField
                label="Button colour"
                helper="Apply buttons and links."
                value={config.buttonColor}
                onChange={(v) => update('buttonColor', v)}
              />
              <ColourField
                label="Heading colour"
                helper="Headings and accents."
                value={config.secondaryColor}
                onChange={(v) => update('secondaryColor', v)}
              />
            </div>

            <CareerPreview
              companyName={companyName ?? 'Your company'}
              config={config}
              jobCount={visibleCount}
            />
          </div>
        </section>

        {/* ── Content ── */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-h3 text-heading">Page content</h2>
          <p className="mt-1 text-body-sm text-muted">
            What candidates read when they land on your page.
          </p>

          <div className="mt-5 space-y-5">
            <div>
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

            <div>
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
          </div>
        </section>

        {/* ── Listings ── */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-h3 text-heading">Job listings</h2>
              <p className="mt-1 text-body-sm text-muted">
                {visibleCount === 0
                  ? 'No jobs are showing — your page will look empty.'
                  : `${visibleCount} of ${activeCount} active ${
                      activeCount === 1 ? 'job' : 'jobs'
                    } shown. Expired jobs are hidden automatically.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setListingsOpen(true)}
              className="inline-flex h-10 w-fit shrink-0 items-center gap-2 rounded-lg border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <ListChecks size={15} />
              Manage listings
            </button>
          </div>
        </section>

        {/* ── SEO, with a Google-style result preview ── */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-h3 text-heading">Search &amp; social</h2>
          <p className="mt-1 text-body-sm text-muted">
            How your page appears in search results and when shared.
          </p>

          {/* Showing the result as Google renders it makes the character
              limits meaningful rather than arbitrary. */}
          <div className="mt-5 rounded-lg border border-border bg-muted-bg p-4">
            <div className="mb-2 flex items-center gap-1.5 text-caption text-muted">
              <Search size={12} aria-hidden />
              Search result preview
            </div>
            <div className="rounded-md bg-surface p-3">
              <p className="truncate text-caption text-muted">{getCareerPageUrl()}</p>
              <p className="mt-0.5 truncate text-body font-medium text-info">
                {config.metaTitle || 'Your page title'}
              </p>
              <p className="mt-0.5 line-clamp-2 text-body-sm text-bodyText">
                {config.metaDescription || 'Your page description appears here.'}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <label htmlFor="meta-title" className="text-body-sm font-medium text-heading">
                  Meta title
                </label>
                <span
                  id="meta-title-count"
                  className={cn(
                    'shrink-0 text-caption tabular-nums',
                    metaTitleOver ? 'font-medium text-error' : 'text-muted'
                  )}
                >
                  {config.metaTitle.length}/{CAREER_META_TITLE_MAX}
                </span>
              </div>
              <Input
                id="meta-title"
                value={config.metaTitle}
                onChange={(e) => update('metaTitle', e.target.value)}
                aria-invalid={metaTitleOver}
                aria-describedby="meta-title-count"
                className={cn(metaTitleOver && 'border-error')}
              />
              {metaTitleOver && (
                <p role="alert" className="mt-1.5 text-body-sm text-error">
                  Search engines will truncate this. Trim it to {CAREER_META_TITLE_MAX} characters.
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <label
                  htmlFor="meta-description"
                  className="text-body-sm font-medium text-heading"
                >
                  Meta description
                </label>
                <span
                  id="meta-description-count"
                  className={cn(
                    'shrink-0 text-caption tabular-nums',
                    metaDescOver ? 'font-medium text-error' : 'text-muted'
                  )}
                >
                  {config.metaDescription.length}/{CAREER_META_DESCRIPTION_MAX}
                </span>
              </div>
              <textarea
                id="meta-description"
                rows={3}
                value={config.metaDescription}
                onChange={(e) => update('metaDescription', e.target.value)}
                aria-invalid={metaDescOver}
                aria-describedby="meta-description-count"
                className={cn(
                  'w-full rounded-lg border bg-background px-3 py-2 text-body text-heading placeholder:text-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10',
                  metaDescOver
                    ? 'border-error'
                    : 'border-border hover:border-border-strong focus-visible:border-primary'
                )}
              />
              {metaDescOver && (
                <p role="alert" className="mt-1.5 text-body-sm text-error">
                  Search engines will truncate this. Trim it to {CAREER_META_DESCRIPTION_MAX}{' '}
                  characters.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <UploadField
                label="Favicon"
                helper="Browser tabs. 32×32px."
                accept="image/png,image/x-icon"
              />
              <UploadField
                label="Social preview image"
                helper="When shared. 1200×630px."
                accept="image/png,image/jpeg"
              />
            </div>
          </div>
        </section>
      </SettingsPage>

      <SaveBar
        visible={isDirty}
        loading={saving}
        saved={justSaved}
        onDiscard={() => {
          if (initial) setConfig(initial);
          setJustSaved(false);
        }}
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

/* ─────────────────────────── Pieces ─────────────────────────── */

/** A read-only value with an inline copy button. */
function ShareField({
  label,
  value,
  icon: Icon,
  mono,
}: {
  label: string;
  value: string;
  icon: typeof Globe;
  mono?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Copying failed. Select the text and copy manually.');
    }
  };

  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-body-sm font-medium text-heading">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <Icon size={14} className="shrink-0 text-muted" aria-hidden />
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-body-sm text-bodyText',
            mono && 'font-mono text-caption'
          )}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label.toLowerCase()}`}
          className="shrink-0 rounded p-1 text-muted transition-colors hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

function ColourField({
  label,
  helper,
  value,
  onChange,
}: {
  label: string;
  helper: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-body-sm font-medium text-heading">{label}</p>
      <p className="mt-0.5 text-body-sm text-muted">{helper}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {PRESET_COLOURS.map((c) => {
          const active = c.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              aria-label={`Use ${c}`}
              aria-pressed={active}
              className={cn(
                'h-7 w-7 shrink-0 rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                active ? 'scale-110 ring-2 ring-heading ring-offset-2 ring-offset-surface' : 'hover:scale-110'
              )}
              style={{ backgroundColor: c }}
            />
          );
        })}
        <label className="relative ml-1 inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border-strong px-2.5 py-1.5 text-caption text-heading transition-colors hover:bg-card-hover">
          <span
            className="h-4 w-4 shrink-0 rounded border border-border"
            style={{ backgroundColor: value }}
            aria-hidden
          />
          {value.toUpperCase()}
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label} custom colour`}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}

/** A miniature of the public page, so colour choices are visible immediately. */
function CareerPreview({
  companyName,
  config,
  jobCount,
}: {
  companyName: string;
  config: CareerPageConfig;
  jobCount: number;
}) {
  const initial = (companyName || 'X').charAt(0).toUpperCase();

  return (
    <div className="min-w-0">
      <p className="mb-2 text-caption font-medium uppercase tracking-wider text-muted">
        Preview
      </p>
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        {/* browser chrome */}
        <div className="flex items-center gap-1.5 border-b border-border bg-muted-bg px-3 py-2">
          {['#EF4444', '#F59E0B', '#10B981'].map((c) => (
            <span key={c} className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
          ))}
        </div>

        <div className="space-y-3 bg-surface p-4">
          {config.showLogo && (
            <div className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded text-caption font-bold text-white"
                style={{ backgroundColor: config.buttonColor }}
              >
                {initial}
              </span>
              <span className="truncate text-caption font-medium text-heading">
                {companyName}
              </span>
            </div>
          )}

          <p
            className="text-body-sm font-semibold"
            style={{ color: config.secondaryColor }}
          >
            Open roles
          </p>

          {Array.from({ length: Math.min(2, Math.max(1, jobCount)) }).map((_, i) => (
            <div key={i} className="rounded-md border border-border p-2.5">
              <div className="h-1.5 w-20 rounded-full bg-border" />
              <div className="mt-1.5 h-1.5 w-28 rounded-full bg-border/60" />
              <span
                className="mt-2 inline-block rounded px-2 py-1 text-[9px] font-medium text-white"
                style={{ backgroundColor: config.buttonColor }}
              >
                Apply
              </span>
            </div>
          ))}

          {jobCount === 0 && (
            <p className="text-caption text-muted">No jobs are showing yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadField({
  label,
  helper,
  accept,
}: {
  label: string;
  helper: string;
  accept: string;
}) {
  const [name, setName] = React.useState<string | null>(null);

  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-body-sm font-medium text-heading">{label}</p>
      <label className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border-strong px-3 text-body-sm text-heading transition-colors hover:bg-card-hover">
        <Upload size={14} className="shrink-0 text-muted" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{name ?? 'Choose a file'}</span>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setName(f.name);
              toast.success(`${label} selected — save to apply`);
            }
            e.target.value = '';
          }}
        />
      </label>
      <p className="mt-1 text-caption text-muted">{helper}</p>
    </div>
  );
}
