'use client';

import * as React from 'react';
import { SetupScreen } from '@/components/interview/setup-screen';
import type { SetupState } from '@/components/interview/camera-preview';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';

const SETUP_STATES: SetupState[] = [
  'checking',
  'ready',
  'denied',
  'no_device',
  'weak_connection',
];

export default function SetupPage() {
  const [forcedState, setForcedState] = React.useState<SetupState | undefined>(
    undefined,
  );
  const [isDev, setIsDev] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsDev(params.has('dev'));
  }, []);

  return (
    <>
      <SetupScreen config={defaultConfig} forcedState={forcedState} />
      {isDev && (
        <DevSetupSwitcher
          current={forcedState}
          onChange={setForcedState}
        />
      )}
    </>
  );
}

function DevSetupSwitcher({
  current,
  onChange,
}: {
  current: SetupState | undefined;
  onChange: (state: SetupState | undefined) => void;
}) {
  const [open, setOpen] = React.useState(true);

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
    minWidth: open ? '200px' : 'auto',
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
        <strong style={{ fontSize: '11px' }}>Setup State</strong>
        <span style={{ fontSize: '10px', color: '#737373' }}>
          {open ? '−' : '+'}
        </span>
      </div>
      {open && (
        <div style={{ marginTop: '8px' }}>
          <button
            style={!current ? btnActive : btnStyle}
            onClick={() => onChange(undefined)}
          >
            real
          </button>
          {SETUP_STATES.map((s) => (
            <button
              key={s}
              style={current === s ? btnActive : btnStyle}
              onClick={() => onChange(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
