'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface HeroBannerProps {
  headline: string;
  subtext: string;
  step: number;
}

/** Abstract inline SVG illustrations per step, built from tonal shapes. */
function HeroIllustration({ step }: { step: number }) {
  // The system is achromatic: these shapes inherit the surrounding ink via
  // currentColor rather than carrying a hardcoded brand hue, so they follow
  // the theme in both light and dark.
  const op = (n: number) => n / 100;
  const indigo = 'currentColor';
  const indigoLight = 'currentColor';

  if (step === 1) {
    // Implied form surface with floating card
    return (
      <svg width="280" height="140" viewBox="0 0 280 140" fill="none" className="hidden text-heading lg:block">
        <rect x="40" y="20" width="200" height="100" rx="12" fill={indigo} fillOpacity={op(12)} />
        <rect x="56" y="36" width="120" height="10" rx="5" fill={indigo} fillOpacity={op(30)} />
        <rect x="56" y="56" width="80" height="8" rx="4" fill={indigo} fillOpacity={op(20)} />
        <rect x="56" y="76" width="160" height="28" rx="6" fill={indigo} fillOpacity={op(15)} />
        <circle cx="220" cy="40" r="12" fill={indigo} fillOpacity={op(25)} />
        <rect x="216" y="36" width="8" height="8" rx="2" fill="white" fillOpacity={op(60)} />
        <line x1="56" y1="120" x2="180" y2="120" stroke={indigo} strokeWidth="1.5" strokeOpacity={op(25)} strokeLinecap="round" />
      </svg>
    );
  }
  if (step === 2) {
    // Question list with checkmarks
    return (
      <svg width="280" height="140" viewBox="0 0 280 140" fill="none" className="hidden text-heading lg:block">
        <rect x="40" y="16" width="200" height="108" rx="12" fill={indigo} fillOpacity={op(10)} />
        <circle cx="56" cy="40" r="8" fill={indigo} fillOpacity={op(25)} />
        <circle cx="56" cy="40" r="4" fill="white" fillOpacity={op(50)} />
        <rect x="72" y="36" width="120" height="8" rx="4" fill={indigo} fillOpacity={op(25)} />
        <circle cx="56" cy="64" r="8" fill={indigo} fillOpacity={op(25)} />
        <rect x="72" y="60" width="90" height="8" rx="4" fill={indigo} fillOpacity={op(20)} />
        <circle cx="56" cy="88" r="8" fill={indigo} fillOpacity={op(25)} />
        <rect x="72" y="84" width="140" height="8" rx="4" fill={indigo} fillOpacity={op(20)} />
        <path d="M52 108l4 4 8-8" stroke={indigoLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity={op(50)} />
        <rect x="72" y="104" width="60" height="8" rx="4" fill={indigo} fillOpacity={op(30)} />
      </svg>
    );
  }
  if (step === 3) {
    // Team avatars
    return (
      <svg width="280" height="140" viewBox="0 0 280 140" fill="none" className="hidden text-heading lg:block">
        <rect x="40" y="20" width="200" height="100" rx="12" fill={indigo} fillOpacity={op(10)} />
        <circle cx="72" cy="50" r="16" fill={indigo} fillOpacity={op(25)} />
        <circle cx="72" cy="44" r="6" fill="white" fillOpacity={op(50)} />
        <rect x="96" y="40" width="60" height="8" rx="4" fill={indigo} fillOpacity={op(25)} />
        <rect x="96" y="54" width="40" height="6" rx="3" fill={indigo} fillOpacity={op(20)} />
        <circle cx="72" cy="90" r="16" fill={indigo} fillOpacity={op(20)} />
        <circle cx="72" cy="84" r="6" fill="white" fillOpacity={op(40)} />
        <rect x="96" y="80" width="50" height="8" rx="4" fill={indigo} fillOpacity={op(20)} />
        <circle cx="200" cy="60" r="20" fill={indigo} fillOpacity={op(15)} />
        <path d="M200 50v20M190 60h20" stroke={indigoLight} strokeWidth="2" strokeLinecap="round" strokeOpacity={op(40)} />
      </svg>
    );
  }
  if (step === 4) {
    // Sliders / customisation
    return (
      <svg width="280" height="140" viewBox="0 0 280 140" fill="none" className="hidden text-heading lg:block">
        <rect x="40" y="20" width="200" height="100" rx="12" fill={indigo} fillOpacity={op(10)} />
        <line x1="56" y1="44" x2="200" y2="44" stroke={indigo} strokeWidth="2" strokeOpacity={op(25)} strokeLinecap="round" />
        <circle cx="80" cy="44" r="6" fill={indigo} fillOpacity={op(40)} />
        <line x1="56" y1="64" x2="200" y2="64" stroke={indigo} strokeWidth="2" strokeOpacity={op(25)} strokeLinecap="round" />
        <circle cx="140" cy="64" r="6" fill={indigo} fillOpacity={op(40)} />
        <line x1="56" y1="84" x2="200" y2="84" stroke={indigo} strokeWidth="2" strokeOpacity={op(25)} strokeLinecap="round" />
        <circle cx="170" cy="84" r="6" fill={indigo} fillOpacity={op(40)} />
        <rect x="56" y="100" width="48" height="10" rx="5" fill={indigo} fillOpacity={op(20)} />
      </svg>
    );
  }
  // Step 5 — mail/envelope
  return (
    <svg width="280" height="140" viewBox="0 0 280 140" fill="none" className="hidden text-heading lg:block">
      <rect x="40" y="24" width="200" height="92" rx="12" fill={indigo} fillOpacity={op(10)} />
      <rect x="56" y="40" width="168" height="60" rx="8" fill={indigo} fillOpacity={op(15)} />
      <path d="M56 48l84 36 84-36" stroke={indigoLight} strokeWidth="2" strokeOpacity={op(35)} strokeLinecap="round" fill="none" />
      <circle cx="220" cy="40" r="10" fill={indigo} fillOpacity={op(30)} />
      <path d="M216 36l8 8M224 36l-8 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity={op(70)} />
    </svg>
  );
}

export function HeroBanner({ headline, subtext, step }: HeroBannerProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-[160px] items-center overflow-hidden rounded-xl bg-hero-gradient p-8'
      )}
    >
      <div className="flex-1">
        <h1 className="text-h1 text-heading">{headline}</h1>
        <p className="mt-2 text-body-lg text-muted">{subtext}</p>
      </div>
      <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 opacity-90">
        <HeroIllustration step={step} />
      </div>
    </div>
  );
}
