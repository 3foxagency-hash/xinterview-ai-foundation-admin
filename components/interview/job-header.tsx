'use client';

import { Clock } from 'lucide-react';
import { strings } from '@/lib/interview/strings';

interface JobHeaderProps {
  companyName: string;
  jobTitle: string;
  questionCount: number;
  estimatedMinutes: number;
  scenario: 'both' | 'description' | 'video' | 'neither';
}

/** Determine title size tier from character count (§8). */
export function titleTierClass(title: string): string {
  const len = title.length;
  const isCaps = title.replace(/[^A-Z]/g, '').length / title.replace(/\s/g, '').length > 0.8;

  let tier: string;
  if (len <= 18) tier = 'iv-title-tier-1';
  else if (len <= 32) tier = 'iv-title-tier-2';
  else if (len <= 48) tier = 'iv-title-tier-3';
  else if (len <= 70) tier = 'iv-title-tier-4';
  else tier = 'iv-title-tier-5';

  // All-caps: drop one tier
  if (isCaps && tier !== 'iv-title-tier-5') {
    const num = parseInt(tier.slice(-1));
    tier = `iv-title-tier-${num + 1}`;
  }

  return isCaps ? `${tier} iv-title-caps` : tier;
}

export function JobHeader({
  companyName,
  jobTitle,
  questionCount,
  estimatedMinutes,
  scenario,
}: JobHeaderProps) {
  const tierClass = titleTierClass(jobTitle);

  return (
    <div
      className="iv-job-header"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        alignItems: 'flex-start',
      }}
    >
      {/* Eyebrow with status dot */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span className="iv-brand-mark iv-brand-mark-sm" aria-hidden="true">
          {companyName.charAt(0).toUpperCase()}
        </span>
        <span className="iv-micro-label">
          {strings.eyebrow(companyName)}
        </span>
      </div>

      {/* Job title */}
      <h1 className={`iv-job-title ${tierClass}`}>
        {jobTitle}
      </h1>

      {/* Hairline rule */}
      <hr className="iv-hairline" style={{ width: '100%', maxWidth: '480px' }} />

      {/* Meta row */}
      <div className="iv-meta-row">
        <span className="iv-meta-item">
          {strings.metaQuestions(questionCount)}
        </span>
        <span className="iv-meta-divider" aria-hidden="true" />
        <span className="iv-meta-item">
          {/* Clock icon in place of the "≈" glyph. */}
          <Clock
            size={13}
            strokeWidth={1.5}
            className="iv-meta-icon"
            aria-hidden="true"
          />
          {strings.metaEstimatedPlain(estimatedMinutes)}
        </span>
        <span className="iv-meta-divider" aria-hidden="true" />
        <span className="iv-meta-item">
          {strings.metaRecord}
        </span>
      </div>
    </div>
  );
}
