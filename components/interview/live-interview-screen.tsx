'use client';

import * as React from 'react';
import { Mic, MicOff, Volume2, LogOut } from 'lucide-react';
import {
  InterviewThemeProvider,
  InterviewThemeScript,
} from '@/components/interview/theme-provider';
import { AmbientLight } from '@/components/interview/ambient-light';
import { TopBar } from '@/components/interview/top-bar';
import { LiveWaveform } from '@/components/interview/live-waveform';
import { strings } from '@/lib/interview/strings';
import { interviewConfig as defaultLandingConfig } from '@/config/interview.mock';
import type { InterviewSession } from '@/config/interview-session';
import {
  useCaptureOrientation,
  videoConstraintsFor,
} from '@/lib/interview/capture-orientation';

/**
 * Live conversational interview — shared by the avatar and voice
 * routes. The two differ only in how the interviewer is presented:
 * `avatar` renders a video tile, `voice` renders an audio visualiser.
 *
 * LiveKit is not wired up yet. The candidate tile uses a real
 * getUserMedia stream so the local preview and mic meter are genuine;
 * the interviewer side is presentational until the LiveKit tracks
 * exist, and every hook it needs is isolated behind `speaker` below.
 */

export type LiveMode = 'avatar' | 'voice';
type Speaker = 'ai' | 'candidate';

interface LiveInterviewScreenProps {
  session: InterviewSession;
  mode: LiveMode;
  jobTitle: string;
  onEnd: () => void;
}

export function LiveInterviewScreen({
  session,
  mode,
  jobTitle,
  onEnd,
}: LiveInterviewScreenProps) {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [muted, setMuted] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [confirmEnd, setConfirmEnd] = React.useState(false);
  // Until LiveKit reports turn-taking, the AI holds the floor and the
  // candidate is listening. This is the single value both tiles read.
  const [speaker] = React.useState<Speaker>('ai');

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const avatarRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const captureOrientation = useCaptureOrientation();

  const landingConfig = React.useMemo(
    () => ({
      ...defaultLandingConfig,
      company: {
        ...defaultLandingConfig.company,
        name: session.company.name,
        brandColor: session.company.brandColor,
        themeMode: session.company.themeMode,
        allowCandidateToggle: session.company.allowCandidateToggle,
      },
    }),
    [session.company],
  );

  // Candidate camera + mic.
  React.useEffect(() => {
    let active = true;
    navigator.mediaDevices
      ?.getUserMedia({
        video: videoConstraintsFor(captureOrientation),
        audio: true,
      })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        setStream(s);
      })
      .catch(() => {});
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [captureOrientation]);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v || !stream) return;
    v.srcObject = stream;
    v.play().catch(() => {});
  }, [stream]);

  // The stand-in avatar only moves while the interviewer holds the
  // floor, so the tile reflects turn-taking rather than looping
  // regardless of what is happening.
  React.useEffect(() => {
    const v = avatarRef.current;
    if (!v) return;
    if (speaker === 'ai') v.play().catch(() => {});
    else v.pause();
  }, [speaker]);

  // Elapsed clock, anchored to a start timestamp so a throttled tab
  // can't slow it down.
  React.useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
  };

  const aiSpeaking = speaker === 'ai';
  const candidateSpeaking = speaker === 'candidate' && !muted;

  const progressPercent = Math.min(
    100,
    (elapsed / Math.max(1, session.live.estimatedMinutes * 60)) * 100,
  );

  const controls = (
    <div className="iv-live-controls">
      <button
        type="button"
        className="iv-live-control"
        onClick={toggleMute}
        aria-pressed={muted}
      >
        {muted ? (
          <MicOff size={20} strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Mic size={20} strokeWidth={1.5} aria-hidden="true" />
        )}
        <span>{muted ? strings.liveUnmute : strings.liveMute}</span>
      </button>

      <span className="iv-live-control-divider" aria-hidden="true" />

      <button type="button" className="iv-live-control">
        <Volume2 size={20} strokeWidth={1.5} aria-hidden="true" />
        <span>{strings.liveVolume}</span>
      </button>

      <span className="iv-live-control-divider" aria-hidden="true" />

      <button
        type="button"
        className="iv-live-control"
        onClick={() => setConfirmEnd(true)}
      >
        <LogOut size={20} strokeWidth={1.5} aria-hidden="true" />
        <span>{strings.liveEndInterview}</span>
      </button>
    </div>
  );

  const candidateTile = (
    <div className="iv-live-tile">
      <div className="iv-live-frame">
        <video
          ref={videoRef}
          className="iv-live-video"
          autoPlay
          playsInline
          muted
        />
        {!stream && (
          <div className="iv-live-frame-empty">{strings.liveConnecting}</div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <InterviewThemeScript
        themeMode={session.company.themeMode}
        allowCandidateToggle={session.company.allowCandidateToggle}
      />
      <InterviewThemeProvider
        brandColor={session.company.brandColor}
        themeMode={session.company.themeMode}
        allowCandidateToggle={session.company.allowCandidateToggle}
      >
        <AmbientLight />
        <TopBar config={landingConfig} />

        <div className="iv-progress-line" aria-hidden="true">
          <div
            className="iv-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className={`iv-live-shell iv-live-${mode}`}>
          {/* Header */}
          <div className="iv-live-header">
            <div className="iv-live-status">
              <span className="iv-live-dot" aria-hidden="true" />
              <span className="iv-micro-label">
                {strings.liveInProgress} · {strings.liveElapsed(elapsed)}
              </span>
            </div>
            <h1 className="iv-live-title">{jobTitle}</h1>
          </div>

          {mode === 'avatar' ? (
            /* ── Avatar: two equal video tiles ── */
            <>
              <div className="iv-live-stage two-up">
                <div className="iv-live-tile">
                  <div
                    className={`iv-live-frame ai ${aiSpeaking ? 'speaking' : ''}`}
                  >
                    {session.live.avatarVideoUrl ? (
                      <video
                        ref={avatarRef}
                        className="iv-live-video"
                        src={session.live.avatarVideoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <div className="iv-live-avatar-placeholder">
                        <LiveWaveform active={aiSpeaking} bars={18} />
                      </div>
                    )}
                    <span className="iv-live-badge">{strings.liveAiBadge}</span>
                  </div>
                </div>
                {candidateTile}
              </div>

              <div className="iv-live-meta two-up">
                <div className="iv-live-meta-cell">
                  <span className="iv-micro-label">
                    {strings.liveInterviewerLabel}
                  </span>
                  <div className="iv-live-meta-right">
                    <LiveWaveform active={aiSpeaking} bars={22} />
                    <span className="iv-live-state">
                      {aiSpeaking ? strings.liveSpeaking : strings.liveListening}
                    </span>
                  </div>
                </div>
                <div className="iv-live-meta-cell">
                  <span className="iv-micro-label">{strings.liveYouLabel}</span>
                  <div className="iv-live-meta-right">
                    <LiveWaveform
                      stream={stream}
                      active={!muted}
                      bars={22}
                    />
                    <span className="iv-live-state">
                      {muted
                        ? strings.liveMuted
                        : candidateSpeaking
                          ? strings.liveSpeaking
                          : strings.liveListening}
                    </span>
                  </div>
                </div>
              </div>

              {controls}

              <p className="iv-live-hint">{strings.liveHint}</p>
              <p className="iv-live-notice">
                {strings.liveRecordedNoticeAvatar}
              </p>
            </>
          ) : (
            /* ── Voice: visualiser hero + candidate side panel ── */
            <>
              <div className="iv-live-stage voice">
                <div className="iv-live-visualiser">
                  <div className="iv-live-visualiser-inner">
                    <LiveWaveform
                      active={aiSpeaking}
                      bars={64}
                      className="iv-live-wave-hero"
                    />
                  </div>
                </div>

                <div className="iv-live-side">
                  {candidateTile}

                  <div className="iv-live-side-meta">
                    <span className="iv-micro-label">
                      {strings.liveYouLabel}
                    </span>
                    <span className="iv-live-state">
                      {muted ? strings.liveMuted : strings.liveListening}
                      <span className="iv-live-dot sm" aria-hidden="true" />
                    </span>
                  </div>

                  <LiveWaveform stream={stream} active={!muted} bars={40} />

                  <hr className="iv-hairline" />

                  {controls}

                  <p className="iv-live-hint">{strings.liveHint}</p>
                </div>
              </div>

              <div className="iv-live-voice-footer">
                <span className="iv-micro-label">
                  {strings.liveInterviewerLabelShort}
                </span>
                <span className="iv-live-state">
                  <span className="iv-live-dot sm" aria-hidden="true" />
                  {aiSpeaking ? strings.liveSpeaking : strings.liveListening}
                </span>
              </div>

              <p className="iv-live-notice">{strings.liveRecordedNotice}</p>
            </>
          )}
        </div>

        {confirmEnd && (
          <div
            className="iv-confirm-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="iv-live-end-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmEnd(false);
            }}
          >
            <div className="iv-confirm-dialog iv-plane">
              <h2 id="iv-live-end-title" className="iv-confirm-title">
                {strings.liveEndConfirmTitle}
              </h2>
              <p className="iv-confirm-body">{strings.liveEndConfirmBody}</p>
              <div className="iv-confirm-actions">
                <button
                  type="button"
                  className="iv-confirm-secondary"
                  onClick={() => setConfirmEnd(false)}
                >
                  {strings.liveEndConfirmCancel}
                </button>
                <button
                  type="button"
                  className="iv-cta iv-confirm-primary"
                  onClick={onEnd}
                  autoFocus
                >
                  {strings.liveEndConfirmEnd}
                </button>
              </div>
            </div>
          </div>
        )}
      </InterviewThemeProvider>
    </>
  );
}
