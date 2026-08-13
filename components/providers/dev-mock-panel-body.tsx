'use client';

import * as React from 'react';
import {
  SCENARIOS,
  SCENARIO_LABELS,
  activeScenario,
  setScenario as persistScenario,
  type Scenario,
} from '@/mocks/scenarios';

/**
 * Body of the dev environment badge and scenario switcher.
 *
 * Reached only through React.lazy from dev-mock-panel, so the scenario list and
 * its labels never enter a production bundle. Do not import this directly.
 */

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV;
const MOCKING_FLAG = process.env.NEXT_PUBLIC_API_MOCKING;
const IS_MOCKED = MOCKING_FLAG === 'enabled' || MOCKING_FLAG === 'partial';

const ENV_STYLES: Record<string, string> = {
  local: 'bg-info/15 text-info border-info/30',
  development: 'bg-success/15 text-success border-success/30',
  staging: 'bg-warning/15 text-warning border-warning/30',
};

export default function DevMockPanelBody() {
  const appEnv = APP_ENV ?? 'local';
  const apiHost = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

  const [open, setOpen] = React.useState(false);
  const [scenario, setScenario] = React.useState<Scenario>('default');

  React.useEffect(() => {
    if (IS_MOCKED) setScenario(activeScenario());
  }, []);

  const change = (next: Scenario) => {
    persistScenario(next);
    setScenario(next);
  };

  return (
    <div className="fixed bottom-4 left-4 z-[100] flex flex-col items-start gap-2 print:hidden">
      {open && IS_MOCKED && (
        <div className="w-72 rounded-lg border border-border bg-surface p-3 shadow-lg">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">
            Mock scenario
          </p>
          <div className="flex flex-col gap-1">
            {SCENARIOS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => change(s)}
                aria-pressed={scenario === s}
                className={`rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                  scenario === s
                    ? 'bg-primary text-primary-foreground'
                    : 'text-bodyText hover:bg-card-hover'
                }`}
              >
                {SCENARIO_LABELS[s]}
              </button>
            ))}
          </div>
          <p className="mt-2.5 border-t border-border pt-2 font-mono text-[10px] leading-relaxed text-muted">
            API {apiHost || '—'}
            <br />
            Applies to the next request. No reload needed.
          </p>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <span
          title={`API: ${apiHost}`}
          className={`rounded-md border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${
            ENV_STYLES[appEnv] ?? 'bg-card-hover text-muted border-border'
          }`}
        >
          {appEnv}
        </span>

        {IS_MOCKED && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            title="Switch mock scenario"
            className="rounded-md border border-warning/30 bg-warning/15 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-warning transition-colors hover:bg-warning/25"
          >
            mock{MOCKING_FLAG === 'partial' ? ':partial' : ''}
            {scenario !== 'default' ? ` · ${scenario}` : ''}
          </button>
        )}
      </div>
    </div>
  );
}
