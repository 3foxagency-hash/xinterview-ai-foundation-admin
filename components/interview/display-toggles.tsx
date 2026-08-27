'use client';

import * as React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { InterviewConfig } from '@/config/interview.mock';

/**
 * TEMPORARY — preview-only control for the landing page.
 *
 * Lets us flip the three job-level display switches (logo, intro video,
 * job description) from the UI so every layout combination can be seen
 * without editing config. Once the API is integrated these values come
 * from the backend and this whole component (plus its usage in
 * interview-page.tsx and the styles under "Display toggles" in
 * interview.css) should be deleted.
 */

type ToggleKey =
  | 'showLogo'
  | 'showIntroVideo'
  | 'showJobDescription'
  | 'stickyForm';

/** Short label for each CV design, shown under the selector. */
const CV_DESIGN_NAMES: Record<number, string> = {
  1: 'Drop zone — dashed box',
  2: 'Inline row — Browse button',
  3: 'Card — icon tile',
  4: 'Minimal — underline',
};

const TOGGLES: Array<{ key: ToggleKey; label: string; hint: string }> = [
  { key: 'showLogo', label: 'Logo', hint: 'Top-bar company mark' },
  { key: 'showIntroVideo', label: 'Intro video', hint: 'Left column player' },
  { key: 'showJobDescription', label: 'Job description', hint: 'Left column card' },
  {
    key: 'stickyForm',
    label: 'Sticky form',
    hint: 'Form holds position on scroll (desktop)',
  },
];

interface DisplayTogglesProps {
  config: InterviewConfig;
  onChange: (config: InterviewConfig) => void;
}

export function DisplayToggles({ config, onChange }: DisplayTogglesProps) {
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const set = (key: ToggleKey, value: boolean) => {
    onChange({ ...config, [key]: value });
  };

  const activeCount = TOGGLES.filter((t) => config[t.key] !== false).length;

  return (
    <div className="iv-dt-root" ref={panelRef}>
      {open && (
        <div className="iv-dt-panel" role="dialog" aria-label="Display options">
          <div className="iv-dt-header">
            <span className="iv-dt-title">Display options</span>
            <button
              type="button"
              className="iv-dt-close"
              onClick={() => setOpen(false)}
              aria-label="Close display options"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>

          <div className="iv-dt-list">
            {TOGGLES.map(({ key, label, hint }) => {
              const checked = config[key] !== false;
              return (
                <label key={key} className="iv-dt-item">
                  <span className="iv-dt-item-text">
                    <span className="iv-dt-item-label">{label}</span>
                    <span className="iv-dt-item-hint">{hint}</span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-label={label}
                    className={`iv-dt-switch ${checked ? 'on' : ''}`}
                    onClick={() => set(key, !checked)}
                  >
                    <span className="iv-dt-knob" aria-hidden="true" />
                  </button>
                </label>
              );
            })}
          </div>

          {/* TEMPORARY — CV design comparison. Radio semantics: exactly
              one is selected at a time. Remove with the rest of this
              component once a design is chosen. */}
          <div className="iv-dt-section">
            <span className="iv-dt-title">CV design</span>
            <div className="iv-dt-designs" role="radiogroup" aria-label="CV design">
              {([1, 2, 3, 4] as const).map((n) => {
                const selected = (config.cvDesign ?? 1) === n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`iv-dt-design ${selected ? 'on' : ''}`}
                    onClick={() => onChange({ ...config, cvDesign: n })}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <span className="iv-dt-design-name">
              {CV_DESIGN_NAMES[config.cvDesign ?? 1]}
            </span>
          </div>

          <p className="iv-dt-note">
            Preview only — the backend will supply these once the API is
            integrated.
          </p>
        </div>
      )}

      <button
        type="button"
        className="iv-dt-trigger"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal size={15} strokeWidth={1.5} aria-hidden="true" />
        <span>Display</span>
        <span className="iv-dt-count" aria-hidden="true">
          {activeCount}/{TOGGLES.length} · CV {config.cvDesign ?? 1}
        </span>
      </button>
    </div>
  );
}
