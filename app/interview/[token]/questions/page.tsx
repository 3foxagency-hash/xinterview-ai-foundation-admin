'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { InterviewScreen } from '@/components/interview/interview-screen';
import { interviewSession } from '@/config/interview-session';
import type { LifecycleState } from '@/components/interview/answer-plane';

const QUESTION_TYPES = ['video', 'audio', 'text', 'choice'] as const;
const LIFECYCLE_STATES: LifecycleState[] = [
  'thinking', 'ready', 'active', 'warning', 'expired', 'review', 'uploading',
];
const END_STATES = ['complete', 'already_completed', 'expired', 'invalid'] as const;
const SIM_FAILURES = ['upload_fail', 'network_drop', 'permission_revoked', 'unsupported_browser'] as const;

export default function QuestionsPage() {
  const router = useRouter();
  const [isDev, setIsDev] = React.useState(false);
  const [forcedQuestion, setForcedQuestion] = React.useState<number | undefined>(undefined);
  const [forcedState, setForcedState] = React.useState<LifecycleState | undefined>(undefined);
  const [forcedEndState, setForcedEndState] = React.useState<
    'complete' | 'already_completed' | 'expired' | 'invalid' | null
  >(null);
  const [simFailure, setSimFailure] = React.useState<
    'upload_fail' | 'network_drop' | 'permission_revoked' | 'unsupported_browser' | null
  >(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsDev(params.has('dev'));
  }, []);

  return (
    <>
      <InterviewScreen
        session={interviewSession}
        forcedQuestionIndex={forcedQuestion}
        forcedState={forcedState}
        forcedEndState={forcedEndState}
        simFailure={simFailure}
        onComplete={() => router.push('./complete')}
      />
      {isDev && (
        <DevControls
          forcedQuestion={forcedQuestion}
          setForcedQuestion={setForcedQuestion}
          forcedState={forcedState}
          setForcedState={setForcedState}
          forcedEndState={forcedEndState}
          setForcedEndState={setForcedEndState}
          simFailure={simFailure}
          setSimFailure={setSimFailure}
        />
      )}
    </>
  );
}

function DevControls(props: {
  forcedQuestion: number | undefined;
  setForcedQuestion: (n: number | undefined) => void;
  forcedState: LifecycleState | undefined;
  setForcedState: (s: LifecycleState | undefined) => void;
  forcedEndState: 'complete' | 'already_completed' | 'expired' | 'invalid' | null;
  setForcedEndState: (s: 'complete' | 'already_completed' | 'expired' | 'invalid' | null) => void;
  simFailure: 'upload_fail' | 'network_drop' | 'permission_revoked' | 'unsupported_browser' | null;
  setSimFailure: (s: 'upload_fail' | 'network_drop' | 'permission_revoked' | 'unsupported_browser' | null) => void;
}) {
  const [open, setOpen] = React.useState(true);

  const panelStyle: React.CSSProperties = {
    position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
    border: '1px solid #e5e5e5', borderRadius: '12px',
    padding: open ? '16px' : '8px 12px', fontSize: '12px',
    fontFamily: 'system-ui, sans-serif', color: '#171717',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: open ? '220px' : 'auto',
    maxHeight: '80vh', overflowY: 'auto',
  };
  const lbl: React.CSSProperties = { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#737373', margin: '8px 0 4px' };
  const row: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '3px' };
  const btn: React.CSSProperties = { padding: '3px 7px', fontSize: '10px', border: '1px solid #d4d4d4', borderRadius: '4px', background: 'white', cursor: 'pointer', color: '#404040' };
  const btnAct: React.CSSProperties = { ...btn, background: '#171717', color: 'white', borderColor: '#171717' };

  const isActive = (val: unknown, current: unknown) => val === current;
  const isNoneActive = (current: unknown) => current === undefined || current === null;

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(p => !p)}>
        <strong style={{ fontSize: '11px' }}>Interview Dev</strong>
        <span style={{ fontSize: '10px', color: '#737373' }}>{open ? '−' : '+'}</span>
      </div>
      {open && (
        <>
          <div style={lbl}>Question type</div>
          <div style={row}>
            <button style={isNoneActive(props.forcedQuestion) ? btnAct : btn} onClick={() => props.setForcedQuestion(undefined)}>real</button>
            {QUESTION_TYPES.map((t, i) => (
              <button key={t} style={isActive(i, props.forcedQuestion) ? btnAct : btn} onClick={() => { props.setForcedQuestion(i); props.setForcedState(undefined); props.setForcedEndState(null); }}>
                {t}
              </button>
            ))}
          </div>

          <div style={lbl}>Lifecycle state</div>
          <div style={row}>
            <button style={isNoneActive(props.forcedState) ? btnAct : btn} onClick={() => props.setForcedState(undefined)}>real</button>
            {LIFECYCLE_STATES.map(s => (
              <button key={s} style={isActive(s, props.forcedState) ? btnAct : btn} onClick={() => { props.setForcedState(s); props.setForcedEndState(null); }}>
                {s}
              </button>
            ))}
          </div>

          <div style={lbl}>End state</div>
          <div style={row}>
            <button style={isNoneActive(props.forcedEndState) ? btnAct : btn} onClick={() => props.setForcedEndState(null)}>none</button>
            {END_STATES.map(s => (
              <button key={s} style={isActive(s, props.forcedEndState) ? btnAct : btn} onClick={() => { props.setForcedEndState(s); props.setForcedState(undefined); }}>
                {s}
              </button>
            ))}
          </div>

          <div style={lbl}>Simulated failure</div>
          <div style={row}>
            <button style={isNoneActive(props.simFailure) ? btnAct : btn} onClick={() => props.setSimFailure(null)}>none</button>
            {SIM_FAILURES.map(s => (
              <button key={s} style={isActive(s, props.simFailure) ? btnAct : btn} onClick={() => props.setSimFailure(s)}>
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
