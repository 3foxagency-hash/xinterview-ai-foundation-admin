'use client';

import * as React from 'react';
import { CompletionScreen } from '@/components/interview/completion-screen';
import type { EndState } from '@/components/interview/completion-screen';
import { interviewSession } from '@/config/interview-session';

const END_STATES: EndState[] = ['complete', 'already_completed', 'expired', 'invalid'];

export default function CompletePage() {
  const [state, setState] = React.useState<EndState>('complete');
  const [isDev, setIsDev] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsDev(params.has('dev'));
    const paramState = params.get('state');
    if (paramState && END_STATES.includes(paramState as EndState)) {
      setState(paramState as EndState);
    }
  }, []);

  return (
    <>
      <CompletionScreen session={interviewSession} state={state} />
      {isDev && (
        <DevEndSwitcher current={state} onChange={setState} />
      )}
    </>
  );
}

function DevEndSwitcher({ current, onChange }: { current: EndState; onChange: (s: EndState) => void }) {
  const [open, setOpen] = React.useState(true);
  const panelStyle: React.CSSProperties = {
    position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
    border: '1px solid #e5e5e5', borderRadius: '12px',
    padding: open ? '16px' : '8px 12px', fontSize: '12px',
    fontFamily: 'system-ui, sans-serif', color: '#171717',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: open ? '180px' : 'auto',
  };
  const btn: React.CSSProperties = { padding: '4px 8px', fontSize: '11px', border: '1px solid #d4d4d4', borderRadius: '4px', background: 'white', cursor: 'pointer', color: '#404040' };
  const btnAct: React.CSSProperties = { ...btn, background: '#171717', color: 'white', borderColor: '#171717' };

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(p => !p)}>
        <strong style={{ fontSize: '11px' }}>End State</strong>
        <span style={{ fontSize: '10px', color: '#737373' }}>{open ? '−' : '+'}</span>
      </div>
      {open && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
          {END_STATES.map(s => (
            <button key={s} style={current === s ? btnAct : btn} onClick={() => onChange(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
