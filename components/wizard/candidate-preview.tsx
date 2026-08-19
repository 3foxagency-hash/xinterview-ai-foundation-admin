'use client';

import * as React from 'react';
import { Clock, Video, ArrowRight, Lock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PreviewBrandingData {
  logoUrl: string;
  companyTitle: string;
  primaryColour: string;
  secondaryColour: string;
  theme: 'light' | 'dark' | 'auto';
  font: string;
  modernInterface: boolean;
}

export interface PreviewWelcomeData {
  headline: string;
  subtitle: string;
  estimatedTime: number;
  introVideoEnabled: boolean;
  introVideoUrl: string;
  introNoteEnabled: boolean;
  introNoteTitle: string;
  introNoteBody: string;
}

const FONT_FAMILIES: Record<string, string> = {
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  opendyslexic: "'OpenDyslexic', sans-serif",
  lato: "'Lato', sans-serif",
  poppins: "'Poppins', sans-serif",
  sourcesans: "'Source Sans Pro', sans-serif",
};

const DEFAULT_BRANDING: PreviewBrandingData = {
  logoUrl: '',
  companyTitle: 'Your Company',
  primaryColour: '#5B4FE9',
  secondaryColour: '#1F242E',
  theme: 'light',
  font: 'inter',
  modernInterface: false,
};

const DEFAULT_WELCOME: PreviewWelcomeData = {
  headline: 'Welcome to your interview',
  subtitle: "We're excited to learn more about you",
  estimatedTime: 15,
  introVideoEnabled: false,
  introVideoUrl: '',
  introNoteEnabled: false,
  introNoteTitle: 'Before you begin',
  introNoteBody: '',
};

function resolveTheme(theme: 'light' | 'dark' | 'auto'): 'light' | 'dark' {
  if (theme === 'auto') return 'light';
  return theme;
}

function darken(hex: string, amount: number): string {
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function CandidatePreview({
  branding = DEFAULT_BRANDING,
  welcome = DEFAULT_WELCOME,
  jobTitle = 'Senior Frontend Engineer',
  className,
  compact = false,
}: {
  branding?: PreviewBrandingData;
  welcome?: PreviewWelcomeData;
  jobTitle?: string;
  className?: string;
  compact?: boolean;
}) {
  const isDark = resolveTheme(branding.theme) === 'dark';
  const fontFamily = FONT_FAMILIES[branding.font] ?? FONT_FAMILIES.inter;
  const primary = branding.primaryColour || '#5B4FE9';
  const secondary = branding.secondaryColour || '#1F242E';

  const bg = isDark ? '#0a0a0a' : '#fafafa';
  const cardBg = isDark ? '#171717' : '#ffffff';
  const textCol = isDark ? '#ededed' : '#171717';
  const mutedCol = isDark ? '#a1a1a1' : '#595959';
  const borderColor = isDark ? '#2e2e2e' : '#e5e5e5';
  const inputBg = isDark ? '#1a1a1a' : '#f4f4f5';

  const glassStyle = branding.modernInterface
    ? {
        backdropFilter: 'blur(12px)',
        background: isDark ? 'rgba(23, 23, 23, 0.8)' : 'rgba(255, 255, 255, 0.85)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
      }
    : {};

  return (
    <div
      className={cn('flex h-full flex-col overflow-hidden', className)}
      style={{ fontFamily, background: bg, color: textCol }}
      aria-label="Candidate landing page preview"
      role="img"
    >
      {/* Browser chrome */}
      <div
        className="flex shrink-0 items-center gap-2 px-3 py-2.5"
        style={{ background: isDark ? '#1a1a1a' : '#f0f0f0', borderBottom: `1px solid ${borderColor}` }}
      >
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#ff5f57' }} />
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#febc2e' }} />
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#28c840' }} />
        </div>
        <div
          className="ml-2 flex h-6 flex-1 items-center rounded-md px-2 text-[11px]"
          style={{ background: isDark ? '#0a0a0a' : '#ffffff', color: mutedCol, border: `1px solid ${borderColor}` }}
        >
          <span className="truncate">interview.yourcompany.com/c/{jobTitle.toLowerCase().replace(/\s+/g, '-')}</span>
        </div>
        <Eye size={13} strokeWidth={1.5} style={{ color: mutedCol }} />
      </div>

      {/* Page body */}
      <div className="flex-1 overflow-y-auto">
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{
            background: cardBg,
            borderBottom: `1px solid ${borderColor}`,
            ...glassStyle,
          }}
        >
          <div className="flex items-center gap-2">
            {branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logoUrl} alt="" className="h-7 w-7 rounded-md object-contain" />
            ) : (
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold"
                style={{ background: primary, color: '#fff' }}
              >
                {(branding.companyTitle || 'Y')[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-[13px] font-semibold" style={{ color: textCol }}>
              {branding.companyTitle || 'Your Company'}
            </span>
          </div>
          <span className="text-[11px]" style={{ color: mutedCol }}>
            Powered by XInterview
          </span>
        </div>

        {/* Hero / content area */}
        <div className={cn('flex flex-col items-center px-6', compact ? 'py-6' : 'py-10')}>
          {/* Intro video or illustration */}
          {welcome.introVideoEnabled && welcome.introVideoUrl ? (
            <div
              className="mb-6 flex w-full max-w-sm items-center justify-center rounded-lg"
              style={{
                background: isDark ? '#1a1a1a' : '#f4f4f5',
                border: `1px solid ${borderColor}`,
                height: compact ? 100 : 140,
              }}
            >
              <Video size={28} strokeWidth={1.5} style={{ color: mutedCol }} />
            </div>
          ) : (
            <div
              className="mb-6 flex items-center justify-center rounded-2xl"
              style={{
                background: withAlpha(primary, 0.08),
                height: compact ? 56 : 72,
                width: compact ? 56 : 72,
              }}
            >
              <Video size={compact ? 22 : 28} strokeWidth={1.5} style={{ color: primary }} />
            </div>
          )}

          {/* Headline */}
          <h1
            className={cn('text-center font-bold leading-tight', compact ? 'text-lg' : 'text-xl')}
            style={{ color: secondary, maxWidth: 320 }}
          >
            {welcome.headline || 'Welcome to your interview'}
          </h1>

          {/* Subtitle */}
          <p
            className={cn('mt-2 text-center', compact ? 'text-[12px]' : 'text-[13px]')}
            style={{ color: mutedCol, maxWidth: 300 }}
          >
            {welcome.subtitle || "We're excited to learn more about you"}
          </p>

          {/* Job title pill */}
          <div
            className="mt-4 rounded-full px-3 py-1 text-[11px] font-medium"
            style={{ background: withAlpha(primary, 0.1), color: primary }}
          >
            {jobTitle}
          </div>

          {/* Meta row */}
          <div className="mt-5 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: mutedCol }}>
              <Clock size={13} strokeWidth={1.5} style={{ color: primary }} />
              ~{welcome.estimatedTime || 15} min
            </span>
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: mutedCol }}>
              <Video size={13} strokeWidth={1.5} style={{ color: primary }} />
              Video interview
            </span>
          </div>

          {/* CTA button */}
          <button
            type="button"
            className="mt-6 flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background: primary, boxShadow: `0 4px 12px ${withAlpha(primary, 0.3)}` }}
          >
            Start interview
            <ArrowRight size={15} strokeWidth={2} />
          </button>

          {/* Intro note preview */}
          {welcome.introNoteEnabled && welcome.introNoteTitle && (
            <div
              className="mt-6 w-full max-w-sm rounded-lg p-4"
              style={{ background: isDark ? '#1a1a1a' : '#f4f4f5', border: `1px solid ${borderColor}` }}
            >
              <div className="flex items-center gap-2">
                <Lock size={13} strokeWidth={1.5} style={{ color: primary }} />
                <span className="text-[12px] font-semibold" style={{ color: textCol }}>
                  {welcome.introNoteTitle}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed" style={{ color: mutedCol }}>
                {welcome.introNoteBody
                  ? welcome.introNoteBody.replace(/<[^>]+>/g, '').slice(0, 120)
                  : 'Candidates must acknowledge this note before continuing.'}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div
                  className="flex h-4 w-4 items-center justify-center rounded"
                  style={{ background: primary }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[11px]" style={{ color: mutedCol }}>
                  I have read and understood
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="mt-auto px-5 py-3 text-center text-[10px]"
          style={{ background: cardBg, borderTop: `1px solid ${borderColor}`, color: mutedCol }}
        >
          {branding.companyTitle || 'Your Company'} · All rights reserved
        </div>
      </div>
    </div>
  );
}
