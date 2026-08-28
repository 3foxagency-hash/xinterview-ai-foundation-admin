'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Captions } from 'lucide-react';
import { InterviewShell } from './interview-shell';
import { AvatarStreamManager } from './avatar-stream-manager';
import { AvatarVideoFrame } from './avatar-video-frame';
import { CandidateSelfView } from './candidate-self-view';
import { CaptionsPanel } from './captions-panel';
import { ConversationControls } from './conversation-controls';
import { MicWaveform } from './mic-waveform';
import { SessionContextPlane } from './session-context-plane';
import { SessionRecorder } from './session-recorder';
import { TurnStatus, VoiceLiveRegion } from './turn-status';
import { DevPanel } from './dev-panel';
import type { InterviewSession } from '@/config/interview-session';
import { interviewConfig as defaultConfig } from '@/config/interview.mock';
import type { AvatarFailure, AvatarQualityTier } from './avatar-types';
import type { VoiceTurnState } from './voice-types';
import { track } from '@/lib/utils/analytics';

interface AvatarInterviewShellProps {
  session: InterviewSession;
}

const expectedSeconds = 15 * 60;

function formatTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function AvatarInterviewShell({ session }: AvatarInterviewShellProps) {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = React.useState<VoiceTurnState>('agent_speaking');
  const [quality, setQuality] = React.useState<AvatarQualityTier>('full');
  const [failure, setFailure] = React.useState<AvatarFailure>('none');
  const [muted, setMuted] = React.useState(false);
  const [volumeOn, setVolumeOn] = React.useState(true);
  const [captionsEnabled, setCaptionsEnabled] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(432);
  const [bargeInNotice, setBargeInNotice] = React.useState(false);
  const [endConfirmation, setEndConfirmation] = React.useState(false);
  const [recordingFailed, setRecordingFailed] = React.useState(false);
  const [avatarReady, setAvatarReady] = React.useState(false);
  const [candidateStream, setCandidateStream] = React.useState<MediaStream | null>(null);
  const [avatarStream, setAvatarStream] = React.useState<MediaStream | null>(null);
  const [captions, setCaptions] = React.useState<string[]>([]);
  const [isDev, setIsDev] = React.useState(false);
  const startedRef = React.useRef(false);

  const startCamera = React.useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (!navigator.mediaDevices?.getUserMedia) {
      setFailure('unsupported_browser');
      return;
    }
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
    const paramsFromUrl = new URLSearchParams(window.location.search);
    setIsDev(paramsFromUrl.has('dev'));
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    track('avatar_interview_started');
    void startCamera();
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => {
      window.clearInterval(timer);
      candidateStream?.getTracks().forEach((trackItem) => trackItem.stop());
      avatarStream?.getTracks().forEach((trackItem) => trackItem.stop());
    };
  }, [avatarStream, candidateStream, startCamera]);

  React.useEffect(() => {
    if (state === 'candidate_speaking') track('turn_changed', { state, format: 'avatar' });
  }, [state]);

  const handleAvatarReady = React.useCallback(() => {
    setAvatarReady(true);
    track('avatar_stream_connected');
  }, []);

  const handleAvatarStream = React.useCallback((stream: MediaStream | null) => {
    setAvatarStream(stream);
  }, []);

  const handleAvatarStall = React.useCallback(() => {
    setFailure((current) => {
      if (current === 'stream_stall') return current;
      track('avatar_stream_stalled');
      return 'stream_stall';
    });
  }, []);

  const handleStateChange = (next: VoiceTurnState) => {
    setState(next);
    if (next === 'candidate_speaking' && state === 'agent_speaking') {
      setBargeInNotice(true);
      track('bargein_triggered');
      window.setTimeout(() => setBargeInNotice(false), 4000);
    }
  };

  const handleQualityChange = (next: AvatarQualityTier) => {
    setQuality(next);
    track('avatar_quality_tier_changed', { tier: next });
    if (next === 'audio_only') {
      setFailure('stream_stall');
    } else if (failure === 'stream_stall') {
      setFailure('none');
    }
  };

  const handleFailure = (next: AvatarFailure) => {
    setFailure(next);
    if (next === 'stream_stall') track('avatar_stream_stalled');
    if (next === 'audio_drop') track('agent_reconnecting');
    if (next === 'provider_unavailable') setAvatarReady(false);
    if (next === 'mic_revoked') setState('connecting');
    if (next === 'recording_upload_failure') setRecordingFailed(true);
  };

  const endInterview = () => setEndConfirmation(true);
  const confirmEnd = () => {
    track('interview_ended_early');
    router.push(`/interview/${params.token}/complete?early=1`);
  };

  const progress = Math.min(100, elapsed / expectedSeconds * 100);
  const streamUnavailable = failure === 'provider_unavailable' || failure === 'unsupported_browser';
  const streamStalled = failure === 'stream_stall' || quality === 'audio_only';
  const combinedStream = React.useMemo(() => {
    const tracks = [...(candidateStream?.getTracks() ?? [])];
    if (avatarStream) tracks.push(...avatarStream.getAudioTracks());
    return tracks.length ? new MediaStream(tracks) : null;
  }, [avatarStream, candidateStream]);

  return (
    <InterviewShell session={session} showProgressLine={false}>
      <div className="iv-avatar-page">
        <div className="iv-avatar-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
        <header className="iv-avatar-header">
          <span className="iv-avatar-eyebrow"><span className="iv-status-dot" aria-hidden="true" />Interview in progress · {formatTime(elapsed)}</span>
          <h1>Senior Product Designer</h1>
          {(bargeInNotice || failure === 'audio_drop' || failure === 'stream_stall') && (
            <p className="iv-avatar-inline-notice" role="status">
              {bargeInNotice ? 'Go ahead — the interviewer stopped to listen.' : failure === 'audio_drop' ? 'Reconnecting to the interviewer…' : 'Video paused to keep the audio clear — the interview is continuing.'}
            </p>
          )}
        </header>

        <main className="iv-avatar-main">
          <div className="iv-avatar-participants">
            <section className={`iv-avatar-participant iv-avatar-interviewer ${state === 'agent_speaking' ? 'is-active' : ''}`} aria-label="AI interviewer">
              <AvatarStreamManager quality={quality} state={state} audioEnabled={volumeOn} simulatedFailure={streamUnavailable} onReady={handleAvatarReady} onStream={handleAvatarStream} onStall={handleAvatarStall}>
                {({ videoRef, ready }) => <AvatarVideoFrame videoRef={videoRef} state={state} quality={quality} ready={ready && avatarReady} audioEnabled={volumeOn} />}
              </AvatarStreamManager>
              <div className="iv-avatar-label-row">
                <span className="iv-micro-label">AI interviewer</span>
                <div className="iv-avatar-status"><TurnStatus state={state} side="agent" /><span className="iv-avatar-speaking-bars" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index} />)}</span></div>
              </div>
            </section>

            <section className={`iv-avatar-participant iv-avatar-candidate ${state === 'candidate_speaking' ? 'is-active' : ''}`} aria-label="Your camera">
              <CandidateSelfView stream={candidateStream} active={state === 'candidate_speaking'} disconnected={failure === 'mic_revoked'} />
              <div className="iv-avatar-label-row">
                <span className="iv-micro-label">You</span>
                <div className="iv-avatar-status"><MicWaveform stream={candidateStream} active={state === 'candidate_speaking'} muted={muted} /><TurnStatus state={state} side="candidate" /></div>
              </div>
            </section>
          </div>

          <div className="iv-avatar-captions-wrap"><CaptionsPanel enabled={captionsEnabled} lines={captions} /></div>

          {endConfirmation ? (
            <section className="iv-avatar-end-plane" aria-live="polite">
              <span className="iv-micro-label">End interview?</span>
              <p>This conversation cannot be resumed.</p>
              <div>
                <button type="button" onClick={confirmEnd}>End interview</button>
                <button type="button" onClick={() => setEndConfirmation(false)}>Stay in the interview</button>
              </div>
            </section>
          ) : (
            <>
              <div className="iv-avatar-controls-wrap">
                <ConversationControls muted={muted} volumeOn={volumeOn} disabled={state === 'connecting'} onMute={() => setMuted((value) => !value)} onVolume={() => setVolumeOn((value) => !value)} onEnd={endInterview} />
                <button className="iv-avatar-captions-toggle" type="button" onClick={() => { setCaptionsEnabled((value) => !value); track('captions_enabled'); }} aria-pressed={captionsEnabled}>
                  <Captions size={15} strokeWidth={1.25} />{captionsEnabled ? 'Hide captions' : 'Show captions'}
                </button>
              </div>
              <SessionContextPlane expectedMinutes={Math.round(expectedSeconds / 60)} recordingFailed={recordingFailed} />
            </>
          )}
        </main>

        <div className="iv-avatar-disclosure" role="note">You’re speaking with an AI interviewer. This conversation is recorded and transcribed for the hiring team.</div>
        {streamStalled && <div className="iv-avatar-sr-status" aria-live="polite">Video paused to keep the audio clear. The interview is continuing.</div>}
        <VoiceLiveRegion state={state} />
        <SessionRecorder stream={combinedStream} enabled={combinedStream !== null} forceFailure={failure === 'recording_upload_failure'} onFailure={() => setRecordingFailed(true)} />
        {isDev && <DevPanel config={defaultConfig} onChange={() => {}} voiceState={state} onVoiceStateChange={handleStateChange} avatarQuality={quality} onAvatarQualityChange={handleQualityChange} avatarFailure={failure} onAvatarFailure={handleFailure} reducedMotion={reducedMotion} onReducedMotionChange={setReducedMotion} />}
      </div>
    </InterviewShell>
  );
}
