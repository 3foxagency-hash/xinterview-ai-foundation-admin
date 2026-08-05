'use client';

import * as React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/providers/theme-toggle';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ---------- data ---------- */

type Swatch = { name: string; varName: string; className: string; textOn?: string };

const brandSwatches: Swatch[] = [
  { name: 'Primary', varName: '--primary', className: 'bg-primary', textOn: 'text-primary-foreground' },
  { name: 'Primary Hover', varName: '--primary-hover', className: 'bg-primary-hover', textOn: 'text-primary-foreground' },
  { name: 'Secondary', varName: '--secondary', className: 'bg-secondary', textOn: 'text-secondary-foreground' },
];

const aiSwatches: Swatch[] = [
  { name: 'Accent AI (AI-only)', varName: '--accent-ai', className: 'bg-accent-ai', textOn: 'text-white' },
  { name: 'Accent AI Hover', varName: '--accent-ai-hover', className: 'bg-accent-ai-hover', textOn: 'text-white' },
];

const surfaceSwatches: Swatch[] = [
  { name: 'Background', varName: '--background', className: 'bg-background border border-border' },
  { name: 'Surface', varName: '--surface', className: 'bg-surface border border-border' },
  { name: 'Border', varName: '--border', className: 'bg-border' },
  { name: 'Card Hover', varName: '--card-hover', className: 'bg-card-hover border border-border' },
  { name: 'Active Menu', varName: '--active-menu-bg', className: 'bg-active-menu-bg border border-border' },
  { name: 'Error Banner', varName: '--error-banner-bg', className: 'bg-error-banner-bg border border-border' },
  { name: 'Success Toast', varName: '--success-toast-bg', className: 'bg-success-toast-bg border border-border' },
];

const textSwatches: Swatch[] = [
  { name: 'Heading', varName: '--heading', className: 'bg-heading', textOn: 'text-white' },
  { name: 'Body', varName: '--body', className: 'bg-body', textOn: 'text-white' },
  { name: 'Muted', varName: '--muted', className: 'bg-muted', textOn: 'text-white' },
];

const statusSwatches: Swatch[] = [
  { name: 'Success', varName: '--success', className: 'bg-success', textOn: 'text-success-foreground' },
  { name: 'Warning', varName: '--warning', className: 'bg-warning', textOn: 'text-warning-foreground' },
  { name: 'Error', varName: '--error', className: 'bg-error', textOn: 'text-error-foreground' },
  { name: 'Info', varName: '--info', className: 'bg-info', textOn: 'text-info-foreground' },
];

const typeScale = [
  { token: 'text-display', label: 'Display', cls: 'text-display', sub: '32 / 40 · 700' },
  { token: 'text-h1', label: 'H1', cls: 'text-h1', sub: '24 / 32 · 700' },
  { token: 'text-h2', label: 'H2', cls: 'text-h2', sub: '20 / 28 · 600' },
  { token: 'text-h3', label: 'H3', cls: 'text-h3', sub: '16 / 24 · 600' },
  { token: 'text-body-lg', label: 'Body Lg', cls: 'text-body-lg', sub: '15 / 24 · 400' },
  { token: 'text-body', label: 'Body', cls: 'text-body', sub: '14 / 20 · 400' },
  { token: 'text-body-sm', label: 'Body Sm', cls: 'text-body-sm', sub: '13 / 18 · 400' },
  { token: 'text-caption', label: 'Caption', cls: 'text-caption', sub: '12 / 16 · 500' },
  { token: 'text-button', label: 'Button', cls: 'text-button', sub: '14 / 20 · 600' },
];

const spacingScale = [
  { token: '4', px: '4px' },
  { token: '8', px: '8px' },
  { token: '12', px: '12px' },
  { token: '16', px: '16px' },
  { token: '24', px: '24px' },
  { token: '32', px: '32px' },
  { token: '48', px: '48px' },
];

const radii = [
  { token: 'rounded-sm', label: 'sm · 6px', cls: 'rounded-sm' },
  { token: 'rounded-md', label: 'md · 8px', cls: 'rounded-md' },
  { token: 'rounded-lg', label: 'lg · 12px', cls: 'rounded-lg' },
  { token: 'rounded-xl', label: 'xl · 16px', cls: 'rounded-xl' },
];

const shadows = [
  { token: 'shadow-sm', label: 'sm', cls: 'shadow-sm' },
  { token: 'shadow-md', label: 'md', cls: 'shadow-md' },
  { token: 'shadow-lg', label: 'lg', cls: 'shadow-lg' },
];

/* ---------- helpers ---------- */

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-h2 text-heading">{title}</h2>
      {desc && <p className="mt-1 text-body-sm text-muted">{desc}</p>}
    </div>
  );
}

function SwatchCard({ s }: { s: Swatch }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className={cn('flex h-20 items-center justify-center p-3', s.className)}>
        {s.textOn && <span className={cn('text-caption', s.textOn)}>Aa</span>}
      </div>
      <div className="border-t border-border p-3">
        <p className="text-caption text-heading">{s.name}</p>
        <p className="mt-0.5 font-mono text-caption text-muted">{s.varName}</p>
      </div>
    </div>
  );
}

function SwatchRow({ title, swatches }: { title: string; swatches: Swatch[] }) {
  return (
    <div>
      <h3 className="mb-3 text-h3 text-heading">{title}</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {swatches.map((s) => (
          <SwatchCard key={s.name} s={s} />
        ))}
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function StyleguidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-h3 text-heading">XInterview</span>
            <span className="text-caption text-muted">Design System</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-caption text-muted">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* hero */}
        <div className="mb-12">
          <p className="text-caption uppercase tracking-wider text-primary">Foundation</p>
          <h1 className="mt-2 text-display text-heading">Token Styleguide</h1>
          <p className="mt-3 max-w-2xl text-body-lg text-bodyText">
            Every color, type style, spacing step, radius and shadow in the system.
            Toggle the theme to inspect light and dark token sets.
          </p>

          {/* AI pill — the single coral exception for this module */}
          <div className="mt-6">
            <span className="inline-flex items-center gap-2 rounded-md border border-accent-ai/30 bg-accent-ai/10 px-3 py-1.5 text-caption font-medium text-accent-ai">
              <Sparkles size={16} strokeWidth={1.5} />
              AI Interview Platform
            </span>
            <p className="mt-2 text-caption text-muted">
              The only place coral appears in this module — meaning reinforced by the word &ldquo;AI&rdquo;.
            </p>
          </div>
        </div>

        {/* colors */}
        <section className="mb-12">
          <SectionTitle title="Color Tokens" desc="Light set on :root, dark set on .dark. Switch the theme to compare." />
          <div className="space-y-8">
            <SwatchRow title="Brand" swatches={brandSwatches} />
            <SwatchRow title="AI Accent (reserved — unused in auth module)" swatches={aiSwatches} />
            <SwatchRow title="Surfaces" swatches={surfaceSwatches} />
            <SwatchRow title="Text" swatches={textSwatches} />
            <SwatchRow title="Status" swatches={statusSwatches} />
          </div>
        </section>

        {/* typography */}
        <section className="mb-12">
          <SectionTitle title="Type Scale" desc="Inter via next/font/google. Headings always use the heading token, never primary." />
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <table className="w-full">
              <tbody>
                {typeScale.map((t) => (
                  <tr key={t.token} className="border-b border-border last:border-0">
                    <td className="w-1/4 px-4 py-4 align-middle">
                      <span className="font-mono text-caption text-muted">{t.token}</span>
                    </td>
                    <td className="w-1/4 px-4 py-4 align-middle">
                      <span className="text-caption text-muted">{t.sub}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('text-heading', t.cls)}>
                        {t.label} — The quick brown fox
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* spacing */}
        <section className="mb-12">
          <SectionTitle title="Spacing Scale" desc="4px base. Use multiples of 4." />
          <div className="space-y-3">
            {spacingScale.map((s) => (
              <div key={s.token} className="flex items-center gap-4">
                <span className="w-16 font-mono text-caption text-muted">{s.px}</span>
                <span className="w-20 font-mono text-caption text-muted">p-{s.token}</span>
                <div className="h-4 rounded-sm bg-primary" style={{ width: s.px }} />
              </div>
            ))}
          </div>
        </section>

        {/* radii */}
        <section className="mb-12">
          <SectionTitle title="Radii" desc="sm badges · md buttons/inputs · lg cards · xl modals" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {radii.map((r) => (
              <div key={r.token} className="rounded-lg border border-border bg-surface p-4 text-center">
                <div className={cn('mx-auto h-16 w-16 border-2 border-primary/40 bg-active-menu-bg', r.cls)} />
                <p className="mt-3 text-caption text-heading">{r.label}</p>
                <p className="font-mono text-caption text-muted">{r.token}</p>
              </div>
            ))}
          </div>
        </section>

        {/* shadows */}
        <section className="mb-12">
          <SectionTitle title="Shadows" desc="Dark mode relies on border edges, not heavy shadow." />
          <div className="grid grid-cols-3 gap-4">
            {shadows.map((s) => (
              <div key={s.token} className="rounded-lg bg-surface p-6 text-center">
                <div className={cn('mx-auto h-16 w-16 rounded-md bg-surface border border-border', s.cls)} />
                <p className="mt-3 text-caption text-heading">{s.label}</p>
                <p className="font-mono text-caption text-muted">{s.token}</p>
              </div>
            ))}
          </div>
        </section>

        {/* buttons + toast preview */}
        <section className="mb-12">
          <SectionTitle title="Button & Toast Preview" />
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-md bg-primary px-4 py-2 text-button text-primary-foreground transition-colors hover:bg-primary-hover">
              Primary
            </button>
            <button className="rounded-md border border-border-strong bg-transparent px-4 py-2 text-button text-heading transition-colors hover:bg-card-hover">
              Secondary
            </button>
            <button className="rounded-md border border-border-strong bg-surface px-4 py-2 text-button text-heading transition-colors hover:bg-card-hover">
              Outline
            </button>
            <button className="rounded-md border border-primary-soft bg-transparent px-4 py-2 text-button text-primary transition-colors hover:bg-active-menu-bg hover:border-primary">
              Ghost
            </button>
            <button
              onClick={() => toast.success('Profile saved', { description: 'Your changes are now live.' })}
              className="inline-flex items-center gap-2 rounded-md bg-success px-4 py-2 text-button text-success-foreground transition-colors"
            >
              <Check size={16} strokeWidth={1.5} />
              Trigger Success Toast
            </button>
            <button
              onClick={() => toast.error('Something went wrong', { description: 'Please try again.' })}
              className="rounded-md bg-error px-4 py-2 text-button text-error-foreground transition-colors"
            >
              Trigger Error Toast
            </button>
          </div>
        </section>

        <footer className="border-t border-border pt-6">
          <p className="text-caption text-muted">
            XInterview · Authentication &amp; Onboarding Module · Indigo is the primary accent. Coral is reserved for AI features only.
          </p>
        </footer>
      </main>
    </div>
  );
}
