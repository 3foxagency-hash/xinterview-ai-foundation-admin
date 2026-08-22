'use client';

import * as React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Code2,
  Home,
  MapPin,
  Monitor,
  PenTool,
  SearchX,
  Send,
  Shield,
  Sparkles,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  getPublicCareerPage,
  CAREER_APPEARANCE_PARAMS,
  type CareerPageConfig,
  type CareerJobListing,
  type PublicCareerPage,
} from '@/lib/api/settings';

/* Public, unauthenticated careers page — reached via the "Direct link" /
   embed code generated on Workspace settings → Careers. It renders using
   the workspace's saved CareerPageConfig, so it stays in sync with the
   settings page without any page-specific overrides. Kept free of the
   dashboard chrome (no sidebar, no app background) so it drops cleanly into
   an <iframe> on a client's own site.

   Appearance settings (colours, show-logo) can also arrive as query params
   — see CAREER_APPEARANCE_PARAMS. This is a stopgap: the settings page's
   in-memory mock store lives in that tab's JS only, so a link opened in a
   new tab can't see unsaved (or even just-saved) edits. The "View live
   page" / "Preview" links attach the current editor values as params so a
   client can check how their colour choices look before/without a shared
   backend. Once a real API backs both pages, drop the param handling here
   and the params these links attach. */

function applyAppearanceParams(
  config: CareerPageConfig,
  params: URLSearchParams
): CareerPageConfig {
  if (!CAREER_APPEARANCE_PARAMS.some((key) => params.has(key))) return config;
  const next = { ...config };
  if (params.has('showLogo')) next.showLogo = params.get('showLogo') === 'true';
  if (params.has('buttonColor')) next.buttonColor = `#${params.get('buttonColor')!.replace(/^#/, '')}`;
  if (params.has('secondaryColor')) next.secondaryColor = `#${params.get('secondaryColor')!.replace(/^#/, '')}`;
  if (params.has('backgroundColor')) next.backgroundColor = `#${params.get('backgroundColor')!.replace(/^#/, '')}`;
  return next;
}

/** Hex + alpha suffix, e.g. tint('#5B4FE9', '14') for a light wash. */
function tint(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

function readableForeground(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#0B0D12';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0B0D12' : '#FFFFFF';
}

/* Department → icon + territory palette. Cycles through the app's existing
   territory colours (jobs/candidates/interviews/reports/ai) so any
   department name gets a consistent, distinct tile without new config. */
const DEPARTMENT_STYLES = [
  { match: /eng|dev|tech/i, icon: Code2, tile: 'bg-jobs-wash text-jobs-ink' },
  { match: /product|pm\b/i, icon: Briefcase, tile: 'bg-candidates-wash text-candidates-ink' },
  { match: /data|analytic/i, icon: BarChart3, tile: 'bg-interviews-wash text-interviews-ink' },
  { match: /design|ux|ui/i, icon: PenTool, tile: 'bg-ai-wash text-ai-ink' },
  { match: /people|hr|talent|ops|operations/i, icon: Shield, tile: 'bg-reports-wash text-reports-ink' },
] as const;
const FALLBACK_DEPARTMENT_STYLE = { icon: Briefcase, tile: 'bg-jobs-wash text-jobs-ink' };

function departmentStyle(department?: string) {
  if (!department) return FALLBACK_DEPARTMENT_STYLE;
  return DEPARTMENT_STYLES.find((d) => d.match.test(department)) ?? FALLBACK_DEPARTMENT_STYLE;
}

const TYPE_BADGE_STYLES: Record<string, string> = {
  'Full-time': 'bg-jobs-wash text-jobs-ink',
  'Part-time': 'bg-reports-wash text-reports-ink',
  Contract: 'bg-ai-wash text-ai-ink',
  Internship: 'bg-candidates-wash text-candidates-ink',
};

const ALL = '__all__';

function CareersLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-transparent" />
        <p className="text-body-sm text-muted">Loading careers page…</p>
      </div>
    </div>
  );
}

function CareersNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="flex w-full max-w-[420px] flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted-bg">
          <SearchX size={28} strokeWidth={1.5} className="text-muted" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-h1 text-heading">Careers page not found</h1>
        <p className="mt-2 text-body text-bodyText">
          This careers page doesn&apos;t exist or is no longer available.
        </p>
      </div>
    </div>
  );
}

function JobCard({
  job,
  buttonColor,
  buttonTextColor,
}: {
  job: CareerJobListing;
  buttonColor: string;
  buttonTextColor: string;
}) {
  const { icon: DeptIcon, tile } = departmentStyle(job.department);
  const locationLine = Array.from(new Set([job.location, job.mode].filter(Boolean)));

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', tile)}>
          <DeptIcon size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-h3 text-heading">{job.title}</h3>
          {job.department && (
            <p className="mt-0.5 text-body-sm text-muted">{job.department}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:shrink-0">
        {locationLine.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-muted">
            {locationLine[0] && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} aria-hidden />
                {locationLine[0]}
              </span>
            )}
            {job.mode && (
              <span className="flex items-center gap-1.5">
                {job.mode === 'Remote' ? <Monitor size={14} aria-hidden /> : <Home size={14} aria-hidden />}
                {job.mode}
              </span>
            )}
          </div>
        )}

        {job.type && (
          <span
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-caption font-medium',
              TYPE_BADGE_STYLES[job.type] ?? 'bg-muted-bg text-muted'
            )}
          >
            {job.type}
          </span>
        )}

        <Link
          href={`/direct-invite/${job.id}`}
          className="inline-flex h-10 w-fit shrink-0 items-center justify-center gap-1.5 rounded-lg px-5 text-button shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: buttonColor, color: buttonTextColor }}
        >
          View role
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </div>
  );
}

function JobFilters({
  jobs,
  team,
  location,
  type,
  remoteOnly,
  onTeamChange,
  onLocationChange,
  onTypeChange,
  onRemoteOnlyChange,
}: {
  jobs: CareerJobListing[];
  team: string;
  location: string;
  type: string;
  remoteOnly: boolean;
  onTeamChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onRemoteOnlyChange: (v: boolean) => void;
}) {
  const teams = Array.from(new Set(jobs.map((j) => j.department).filter(Boolean))) as string[];
  const locations = Array.from(new Set(jobs.map((j) => j.location).filter(Boolean))) as string[];
  const types = Array.from(new Set(jobs.map((j) => j.type).filter(Boolean))) as string[];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={team} onValueChange={onTeamChange}>
        <SelectTrigger className="h-10 w-auto min-w-[132px] gap-2 rounded-lg border-border-strong bg-surface text-body-sm">
          <SelectValue placeholder="All Teams" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Teams</SelectItem>
          {teams.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={location} onValueChange={onLocationChange}>
        <SelectTrigger className="h-10 w-auto min-w-[150px] gap-2 rounded-lg border-border-strong bg-surface text-body-sm">
          <SelectValue placeholder="All Locations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Locations</SelectItem>
          {locations.map((l) => (
            <SelectItem key={l} value={l}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={type} onValueChange={onTypeChange}>
        <SelectTrigger className="h-10 w-auto min-w-[132px] gap-2 rounded-lg border-border-strong bg-surface text-body-sm">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Types</SelectItem>
          {types.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        onClick={() => onRemoteOnlyChange(!remoteOnly)}
        aria-pressed={remoteOnly}
        className={cn(
          'inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3.5 text-body-sm font-medium transition-colors',
          remoteOnly
            ? 'border-primary bg-primary-soft text-primary-ink'
            : 'border-border-strong bg-surface text-heading hover:bg-card-hover'
        )}
      >
        <Monitor size={15} aria-hidden />
        Remote only
      </button>
    </div>
  );
}

function CareersView({ data }: { data: PublicCareerPage }) {
  const { config, companyName, logoUrl } = data;
  const buttonTextColor = readableForeground(config.buttonColor);
  /* Everything sitting directly on the configured background (as opposed to
     inside a bg-surface job card) needs a foreground derived from that same
     background, since it's an arbitrary client-chosen colour rather than a
     theme-aware design token. */
  const pageForeground = readableForeground(config.backgroundColor);
  const pageMuted = `${pageForeground}99`;
  const allJobs = config.listings.filter((l) => l.visible && !l.expired);
  const initial = (companyName || 'X').charAt(0).toUpperCase();

  /* welcomeMessage is rich text meant as the page's main heading/intro
     elsewhere on the site; here it doubles as the hero subtitle once its own
     <h1> is stripped. If that leaves nothing (e.g. the "<h1>Careers</h1>"
     default), fall back to a generic line rather than an empty hero. */
  const welcomeSubtitle = config.welcomeMessage
    .replace(/<h1[^>]*>.*?<\/h1>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&rsquo;/g, '’')
    .trim();

  const [team, setTeam] = React.useState(ALL);
  const [location, setLocation] = React.useState(ALL);
  const [type, setType] = React.useState(ALL);
  const [remoteOnly, setRemoteOnly] = React.useState(false);

  const jobs = allJobs.filter(
    (j) =>
      (team === ALL || j.department === team) &&
      (location === ALL || j.location === location) &&
      (type === ALL || j.type === type) &&
      (!remoteOnly || j.mode === 'Remote')
  );

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: config.backgroundColor }}>
      <div className="mx-auto w-full max-w-[960px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {config.showLogo && (
          <div className="mb-10 flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={`${companyName} logo`}
                className="h-9 w-auto max-w-[160px] object-contain"
              />
            ) : (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-body font-semibold text-white"
                style={{ backgroundColor: config.buttonColor }}
              >
                {initial}
              </span>
            )}
            <span className="text-h3 font-medium" style={{ color: pageForeground }}>
              {companyName}
            </span>
          </div>
        )}

        {/* ── Hero ── */}
        <header
          className="relative overflow-hidden rounded-2xl border border-border px-6 py-7 text-center sm:px-10 sm:py-9"
          style={{
            background: `linear-gradient(135deg, ${tint(config.buttonColor, '1F')}, ${tint(config.buttonColor, '05')})`,
          }}
        >
          <h1 className="text-h1 sm:text-[2rem] sm:leading-tight" style={{ color: pageForeground }}>
            Build the future with{' '}
            <span style={{ color: config.secondaryColor }}>{companyName}</span>
          </h1>
          <p
            className="mx-auto mt-2 max-w-[560px] text-body"
            style={{ color: pageMuted }}
          >
            {welcomeSubtitle || `Join a team that's transforming the way the world hires.`}
          </p>
        </header>

        {/* ── Open roles ── */}
        <section className="mt-10 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${config.buttonColor}1A`, color: config.buttonColor }}
              >
                <Briefcase size={17} aria-hidden />
              </span>
              <div>
                <h2 className="text-h3 font-semibold text-heading">Open roles</h2>
                <p className="text-body-sm text-muted">
                  Showing {jobs.length} of {allJobs.length} open {allJobs.length === 1 ? 'role' : 'roles'}
                </p>
              </div>
            </div>

            {allJobs.length > 0 && (
              <JobFilters
                jobs={allJobs}
                team={team}
                location={location}
                type={type}
                remoteOnly={remoteOnly}
                onTeamChange={setTeam}
                onLocationChange={setLocation}
                onTypeChange={setType}
                onRemoteOnlyChange={setRemoteOnly}
              />
            )}
          </div>

          <div className="mt-5 space-y-3">
            {allJobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface-sunken p-8 text-center">
                <p className="text-body text-muted">
                  There are no open roles right now — check back soon.
                </p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface-sunken p-8 text-center">
                <p className="text-body text-muted">No roles match your filters.</p>
              </div>
            ) : (
              jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  buttonColor={config.buttonColor}
                  buttonTextColor={buttonTextColor}
                />
              ))
            )}
          </div>
        </section>

        {/* ── CTA ── */}
        <section
          className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
          style={{ backgroundColor: tint(config.buttonColor, '14') }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface"
              style={{ color: config.buttonColor }}
            >
              <Sparkles size={18} aria-hidden />
            </span>
            <div>
              <p className="text-body font-semibold text-heading">Don&apos;t see the right role?</p>
              <p className="text-body-sm text-muted">
                We&apos;re always looking for great talent. Send us your resume!
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover sm:w-fit"
          >
            <Send size={14} aria-hidden />
            Send your resume
          </button>
        </section>

        <footer
          className="mt-10 border-t pt-6 text-center text-caption"
          style={{ borderColor: pageMuted, color: pageMuted }}
        >
          Powered by XInterview
        </footer>
      </div>
    </div>
  );
}

function PublicCareersView() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [data, setData] = React.useState<PublicCareerPage | null | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getPublicCareerPage(params.id);
      if (!cancelled) setData(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (data === undefined) return <CareersLoading />;
  if (data === null) return <CareersNotFound />;

  const config = applyAppearanceParams(data.config, searchParams);
  return <CareersView data={{ ...data, config }} />;
}

export default function PublicCareersPage() {
  return (
    <React.Suspense fallback={<CareersLoading />}>
      <PublicCareersView />
    </React.Suspense>
  );
}
