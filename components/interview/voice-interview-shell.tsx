'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Captions } from 'lucide-react';
import { InterviewShell } from './interview-shell';
import { AgentAudioAnalyser } from './agent-audio-analyser';
import { AgentPresence } from './agent-presence';
import { CandidateSelfView } from './candidate-self-view';
import { CaptionsPanel } from './captions-panel';
import { ConversationControls } from './conversation-controls';
import { MicWaveform } from './mic-waveform';
import { SessionContextPlane } from './session-context-plane';
import { SessionRecorder } from './session-recorder';
import { TurnStatus, VoiceLiveRegion } from './turn-status';
import { DevPanel } from './dev-panel';
import type { VoiceFailure, VoiceTurnState } from './voice-types';
import type { InterviewSession } from '@/config/interview-session';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';
import { track } from '@/lib/utils/analytics';

interface VoiceInterviewShellProps {
  token: string;
  session: InterviewSession;
}

const expectedSeconds = 15 * 60;

export function VoiceInterviewShell({ token, session }: VoiceInterviewShellProps) {
  const router = useRouter();
  const [state, setState] = React.useState<VoiceTurnState>('agent_speaking');
  const [failure, setFailure] = React.useState<VoiceFailure>('none');
  const [muted, setMuted] = React.useState(false);
  const [volumeOn, setVolumeOn] = React.useState(true);
  const [captionsEnabled, setCaptionsEnabled] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(432);
  const [bargeInNotice, setBargeInNotice] = React.useState(false);
  const [recordingFailed, setRecordingFailed] = React.useState(false);
  const [candidateStream, setCandidateStream] = React.useState<MediaStream | null>(null);
  const [agentStream, setAgentStream] = React.useState<MediaStream | null>(null);
  const [agentAmplitude, setAgentAmplitude] = React.useState(0.25);
  const [captions, setCaptions] = React.useState<string[]>([]);
  const [isDev, setIsDev] = React.useState(false);
  const startedRef = React.useRef(false);

  const start = React.useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      setCandidateStream(stream);
    } catch {
      setFailure('mic_revoked');
    }
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsDev(params.has('dev'));
    track('voice_interview_started');
    void start();
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => {
      window.clearInterval(timer);
      candidateStream?.getTracks().forEach((trackItem) => trackItem.stop());
      agentStream?.getTracks().forEach((trackItem) => trackItem.stop());
    };
  }, [agentStream, candidateStream, start]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  React.useEffect(() => {
    if (state === 'candidate_speaking') track('turn_changed', { state });
  }, [state]);

  React.useEffect(() => {
    if (state !== 'agent_speaking') return;
    const context = new (window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const analyser = context.createAnalyser();
    const destination = context.createMediaStreamDestination();
    oscillator.frequency.value = 180;
    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(analyser);
    analyser.connect(destination);
    oscillator.start();
    setAgentStream(destination.stream);
    track('agent_connected');
    return () => {
      oscillator.stop();
      void context.close();
      setAgentStream(null);
    };
  }, [state]);

  React.useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') setElapsed((value) => value);
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const combinedStream = React.useMemo(() => {
    if (!candidateStream) return null;
    const tracks = [...candidateStream.getTracks()];
    if (agentStream) tracks.push(...agentStream.getAudioTracks());
    return new MediaStream(tracks);
  }, [agentStream, candidateStream]);

  const handleStateChange = (next: VoiceTurnState) => {
    setState(next);
    if (next === 'candidate_speaking' && state === 'agent_speaking') {
      setBargeInNotice(true);
      track('bargein_triggered');
      window.setTimeout(() => setBargeInNotice(false), 4000);
    }
  };

  const handleFailure = (next: VoiceFailure) => {
    setFailure(next);
    if (next === 'agent_disconnect') {
      setState('connecting');
      track('agent_reconnecting');
    }
    if (next === 'unstable_connection') track('connection_degraded');
    if (next === 'mic_revoked') setState('connecting');
  };

  const endInterview = () => {
    track('interview_ended_early');
    router.push(`/interview/${token}/complete?early=1`);
  };

  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const progress = Math.min(100, elapsed / expectedSeconds * 100);

  return (
    <InterviewShell session={session} showProgressLine={false}>
      <div className={`iv-voice-page ${failure !== 'none' ? `has-${failure}` : ''}`}>
        <div className="iv-voice-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
        <div className="iv-voice-header">
          <div className="iv-voice-header-copy">
            <span className="iv-voice-eyebrow"><span className="iv-status-dot" aria-hidden="true" />Interview in progress · {formatTime(elapsed)}</span>
            <h1>{session.questions[0]?.text ? 'Senior Product Designer' : 'Live interview'}</h1>
          </div>
          {(bargeInNotice || failure === 'agent_disconnect' || failure === 'unstable_connection') && (
            <p className={`iv-voice-inline-notice ${failure !== 'none' ? 'is-warning' : ''}`} role="status">
              {bargeInNotice ? 'Go ahead — the interviewer stopped to listen.' : failure === 'agent_disconnect' ? 'Reconnecting to the interviewer…' : 'Your connection is unstable — the interviewer may pause.'}
            </p>
          )}
        </div>

        <main className="iv-voice-layout">
          <section className="iv-voice-agent-column" aria-label="The interviewer">
            <AgentAudioAnalyser stream={agentStream} active={state === 'agent_speaking'} reducedMotion={reducedMotion} onAmplitude={setAgentAmplitude} />
            <AgentPresence state={state} amplitude={agentAmplitude} reducedMotion={reducedMotion} lineCount={140} />
            <CaptionsPanel enabled={captionsEnabled} lines={captions} />
            <div className="iv-voice-section-label"><span className="iv-micro-label">Interviewer</span><TurnStatus state={state} side="agent" /></div>
          </section>

          <aside className="iv-voice-candidate-column">
            <CandidateSelfView stream={candidateStream} active={state === 'candidate_speaking'} disconnected={failure === 'mic_revoked'} />
            <div className="iv-voice-section-label"><span className="iv-micro-label">You</span><TurnStatus state={state} side="candidate" /></div>
            <MicWaveform stream={candidateStream} active={state === 'candidate_speaking'} muted={muted} />
            <div className="iv-voice-candidate-rule" />
            <ConversationControls muted={muted} volumeOn={volumeOn} disabled={state === 'connecting'} onMute={() => setMuted((value) => !value)} onVolume={() => setVolumeOn((value) => !value)} onEnd={endInterview} />
            <button className="iv-voice-captions-toggle" type="button" onClick={() => { setCaptionsEnabled((value) => !value); track('captions_enabled'); }} aria-pressed={captionsEnabled}>
              <Captions size={15} strokeWidth={1.25} />
              {captionsEnabled ? 'Hide captions' : 'Show captions'}
            </button>
            <SessionContextPlane expectedMinutes={Math.round(expectedSeconds / 60)} recordingFailed={recordingFailed} />
          </aside>
        </main>
        <div className="iv-voice-sr-status" aria-live="polite">{failure === 'mic_revoked' ? 'Your camera or microphone needs attention.' : ''}</div>
        <VoiceLiveRegion state={state} />
        <SessionRecorder stream={combinedStream} enabled={candidateStream !== null} forceFailure={failure === 'recording_upload_failure'} onFailure={() => setRecordingFailed(true)} />
        {isDev && <DevPanel config={defaultConfig} onChange={() => {}} voiceState={state} onVoiceStateChange={handleStateChange} onVoiceFailure={handleFailure} reducedMotion={reducedMotion} onReducedMotionChange={setReducedMotion} />}
      </div>
    </InterviewShell>
  );
}
