'use client';

import * as React from 'react';
import type {
  InterviewConfig,
  InterviewState,
  ThemeMode,
} from '@/config/interview.mock';

interface DevPanelProps {
  config: InterviewConfig;
  onChange: (config: InterviewConfig) => void;
}

const BRAND_PRESETS: Array<{ label: string; color: string }> = [
  { label: 'Deep green', color: '#2F5D50' },
  { label: 'Terracotta', color: '#C4633F' },
  { label: 'Navy', color: '#1B3A6B' },
  { label: 'Yellow', color: '#F5C518' },
  { label: 'Near-black', color: '#111111' },
];

const STATE_OPTIONS: InterviewState[] = [
  'active',
  'expired',
  'invalid',
  'completed',
  'no_questions',
];

const THEME_OPTIONS: ThemeMode[] = ['system', 'light', 'dark'];

const SCENARIO_PRESETS: Partial<InterviewConfig>[] = [
  // A — Both
  {
    job: {
      title: 'Senior Product Designer',
      descriptionHtml:
        '<p>At Northwind, we design digital experiences that help millions of people move through their day with less friction and more delight.</p><h4>What you will do</h4><ul><li>Lead end-to-end design for features used by over 2 million customers</li><li>Partner closely with engineering and product</li></ul>',
      questionCount: 6,
      estimatedMinutes: 18,
    },
    introVideo: {
      url: 'https://example.com/intro.mp4',
      posterUrl: '/images/ui/f231f007-979b-4b15-8aa9-b3d1c54c4a33_(1).png',
      durationLabel: '1:24',
      presenterName: 'Sarah Chen',
      presenterTitle: 'Design Director',
    },
  },
  // B — Description only
  {
    job: {
      title: 'Senior Product Designer',
      descriptionHtml:
        '<p>At Northwind, we design digital experiences that help millions of people move through their day with less friction and more delight.</p><h4>What you will do</h4><ul><li>Lead end-to-end design for features used by over 2 million customers</li><li>Partner closely with engineering and product</li></ul>',
      questionCount: 6,
      estimatedMinutes: 18,
    },
    introVideo: null,
  },
  // C — Video only
  {
    job: {
      title: 'Senior Product Designer',
      descriptionHtml: null,
      questionCount: 6,
      estimatedMinutes: 18,
    },
    introVideo: {
      url: 'https://example.com/intro.mp4',
      posterUrl: '/images/ui/f231f007-979b-4b15-8aa9-b3d1c54c4a33_(1).png',
      durationLabel: '1:24',
      presenterName: 'Sarah Chen',
      presenterTitle: 'Design Director',
    },
  },
  // D — Neither
  {
    job: {
      title: 'Senior Product Designer',
      descriptionHtml: null,
      questionCount: 6,
      estimatedMinutes: 18,
    },
    introVideo: null,
  },
];

export function DevPanel({ config, onChange }: DevPanelProps) {
  const [open, setOpen] = React.useState(true);
  const [scenario, setScenario] = React.useState(0);

  const applyScenario = (idx: number) => {
    setScenario(idx);
    onChange({ ...config, ...SCENARIO_PRESETS[idx] });
  };

  const updateBrand = (color: string) => {
    onChange({ ...config, company: { ...config.company, brandColor: color } });
  };

  const updateState = (state: InterviewState) => {
    onChange({ ...config, state });
  };

  const updateTheme = (mode: ThemeMode) => {
    onChange({ ...config, company: { ...config.company, themeMode: mode } });
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: open ? '16px' : '8px 12px',
    fontSize: '12px',
    fontFamily: 'system-ui, sans-serif',
    color: '#171717',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    minWidth: open ? '240px' : 'auto',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#737373',
    marginBottom: '6px',
    marginTop: '12px',
  };

  const buttonRow: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  };

  const btnStyle: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: '11px',
    border: '1px solid #d4d4d4',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer',
    color: '#404040',
  };

  const btnActive: React.CSSProperties = {
    ...btnStyle,
    background: '#171717',
    color: 'white',
    borderColor: '#171717',
  };

  return (
    <div style={panelStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setOpen((p) => !p)}
      >
        <strong style={{ fontSize: '11px' }}>Dev Controls</strong>
        <span style={{ fontSize: '10px', color: '#737373' }}>
          {open ? '−' : '+'}
        </span>
      </div>

      {open && (
        <>
          <div style={sectionLabel}>Scenario</div>
          <div style={buttonRow}>
            <button
              style={scenario === 0 ? btnActive : btnStyle}
              onClick={() => applyScenario(0)}
            >
              A: Both
            </button>
            <button
              style={scenario === 1 ? btnActive : btnStyle}
              onClick={() => applyScenario(1)}
            >
              B: Desc
            </button>
            <button
              style={scenario === 2 ? btnActive : btnStyle}
              onClick={() => applyScenario(2)}
            >
              C: Video
            </button>
            <button
              style={scenario === 3 ? btnActive : btnStyle}
              onClick={() => applyScenario(3)}
            >
              D: Neither
            </button>
          </div>

          <div style={sectionLabel}>Page state</div>
          <div style={buttonRow}>
            {STATE_OPTIONS.map((s) => (
              <button
                key={s}
                style={config.state === s ? btnActive : btnStyle}
                onClick={() => updateState(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={sectionLabel}>Theme mode</div>
          <div style={buttonRow}>
            {THEME_OPTIONS.map((t) => (
              <button
                key={t}
                style={config.company.themeMode === t ? btnActive : btnStyle}
                onClick={() => updateTheme(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={sectionLabel}>Brand colour</div>
          <div style={buttonRow}>
            {BRAND_PRESETS.map((b) => (
              <button
                key={b.color}
                style={{
                  ...(config.company.brandColor === b.color ? btnActive : btnStyle),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onClick={() => updateBrand(b.color)}
              >
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: b.color,
                    border: '1px solid rgba(0,0,0,0.1)',
                    display: 'inline-block',
                  }}
                />
                {b.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
