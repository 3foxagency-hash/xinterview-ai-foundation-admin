'use client';

import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { InterviewShell } from '@/components/interview/interview-shell';
import { QuestionPanel } from '@/components/interview/question-panel';
import { AnswerPlane, initialLifecycleState } from '@/components/interview/answer-plane';
import type { LifecycleState } from '@/components/interview/answer-plane';
import { TimerTrack, useServerAnchoredTimer } from '@/components/interview/timer-track';
import { RecordingControls } from '@/components/interview/recording-controls';
import { VideoRecorder } from '@/components/interview/video-recorder';
import { AudioRecorder } from '@/components/interview/audio-recorder';
import { TextAnswerInput } from '@/components/interview/text-answer-input';
import { ChoiceAnswer } from '@/components/interview/choice-answer';
import { strings } from '@/lib/interview/strings';
import {
  useCaptureOrientation,
  videoConstraintsFor,
} from '@/lib/interview/capture-orientation';
import type { InterviewSession } from '@/config/interview-session';

interface PracticeScreenProps {
  session: InterviewSession;
  onComplete: () => void;
  /** Retained for API compatibility. The "Back to Setup" control that
   *  called this was replaced by "Start Interview" in 2.3c, so nothing
   *  invokes it today. */
  onBack: () => void;
}

type PracticePhase = 'questions' | 'confirmation';

export function PracticeScreen({ session, onComplete }: PracticeScreenProps) {
  const [phase, setPhase] = React.useState<PracticePhase>('questions');
  const [index, setIndex] = React.useState(0);
  const [lifecycle, setLifecycle] = React.useState<LifecycleState>(() =>
    initialLifecycleState(session.practice.questions[0]),
  );
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  /** Mirrors `stream` for callbacks that outlive their closure. The
   *  countdown interval is created once per countdown, so reading the
   *  `stream` state variable inside it captured whatever value existed
   *  when the effect ran — usually null, since getUserMedia resolves
   *  after the countdown starts. That made the countdown reach 0 and
   *  do nothing even when a camera was available (2.3a). */
  const streamRef = React.useRef<MediaStream | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [timerStart, setTimerStart] = React.useState<number | null>(null);
  const [retakesUsed, setRetakesUsed] = React.useState(0);
  const [recordingUrl, setRecordingUrl] = React.useState<string | null>(null);
  const [reviewPlaying, setReviewPlaying] = React.useState(false);
  const [reviewElapsed, setReviewElapsed] = React.useState(0);
  const [thinkingRemaining, setThinkingRemaining] = React.useState(0);
  const [thinkingStart, setThinkingStart] = React.useState<number | null>(null);
  /** Set when getUserMedia fails, so the countdown reaching 0 shows the
   *  permission-error state instead of silently doing nothing (2.3a). */
  const [mediaError, setMediaError] = React.useState<'permission' | null>(null);
  /** Guards against double-starting when the countdown fires at the same
   *  moment the candidate clicks "Start now" (2.3a). */
  const startingRef = React.useRef(false);
  /** Bumped by "Try again" to re-run the getUserMedia effect. */
  const [streamAttempt, setStreamAttempt] = React.useState(0);
  /** 2.3c — confirmation before leaving practice for the real interview. */
  const [showStartConfirm, setShowStartConfirm] = React.useState(false);
  const [textContent, setTextContent] = React.useState('');
  const [choiceSelected, setChoiceSelected] = React.useState<string[]>([]);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const elapsedRef = React.useRef<ReturnType<typeof setInterval>>(undefined);

  const questions = session.practice.questions;
  const question = questions[index];
  const retakesRemaining = question.retakesAllowed - retakesUsed;
  const isVideoOrAudio = question.type === 'video' || question.type === 'audio';
  const captureOrientation = useCaptureOrientation();

  const { remainingMs, warning } = useServerAnchoredTimer(
    question.answerSeconds ?? 0,
    timerStart,
    () => {
      if (question.answerSeconds) {
        setLifecycle('expired');
        stopRecording();
        setTimeout(() => setLifecycle('review'), 1500);
      }
    },
  );

  // Keyed on `index` too (not just `lifecycle`) so back-to-back questions
  // that both start in 'thinking' still restart the countdown — a useState
  // setter is a no-op when the value is unchanged, so 'thinking' → 'thinking'
  // across questions wouldn't otherwise re-fire this effect.
  React.useEffect(() => {
    if (lifecycle !== 'thinking' || question.thinkingSeconds === 0) return;
    setThinkingStart(Date.now());
    setThinkingRemaining(question.thinkingSeconds * 1000);
  }, [lifecycle, question.thinkingSeconds, index]);

  // 2.3a — when the countdown reaches 0 recording must actually start.
  // Remaining time is derived from the stored `thinkingStart` timestamp
  // rather than a decrementing counter, so a throttled/background tab
  // can't stretch the countdown.
  React.useEffect(() => {
    if (lifecycle !== 'thinking' || thinkingStart === null) return;
    let fired = false;
    const id = setInterval(() => {
      const remaining =
        question.thinkingSeconds * 1000 - (Date.now() - thinkingStart);
      if (remaining <= 0) {
        if (fired) return;
        fired = true;
        clearInterval(id);
        setThinkingRemaining(0);
        beginRecording();
      } else {
        setThinkingRemaining(remaining);
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifecycle, thinkingStart, question.thinkingSeconds]);

  // Acquire media stream only for video/audio questions.
  React.useEffect(() => {
    if (!isVideoOrAudio) return;
    let active = true;
    // 2.7 — mobile captures portrait (9:16), desktop landscape (16:9).
    // Orientation comes from viewport + pointer, never UA sniffing.
    const constraints: MediaStreamConstraints = {
      video:
        question.type === 'video'
          ? videoConstraintsFor(captureOrientation)
          : false,
      audio: true,
    };
    setMediaError(null);
    navigator.mediaDevices?.getUserMedia(constraints)
      .then((s) => {
        if (!active) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        setStream(s);
      })
      .catch(() => {
        // 2.3a — a failure here used to be swallowed, so the countdown
        // would reach 0 and silently do nothing. Surface it instead.
        if (active) setMediaError('permission');
      });
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.type, index, streamAttempt, captureOrientation]);

  React.useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Single entry point for starting an answer — from the countdown
   *  hitting 0 or from "Start now". Guards against double-starting and,
   *  crucially, surfaces a missing stream rather than returning
   *  silently the way startRecording() alone used to (2.3a). */
  function beginRecording() {
    if (startingRef.current) return;
    if (lifecycle === 'active' || lifecycle === 'warning') return;
    if (!streamRef.current) {
      // Countdown finished but we never got a camera/mic — stop the
      // countdown and show the permission-error state.
      setMediaError('permission');
      setThinkingStart(null);
      setLifecycle('ready');
      return;
    }
    startingRef.current = true;
    startRecording();
    // Released on the next tick; the lifecycle check above covers the
    // rest of the recording.
    window.setTimeout(() => { startingRef.current = false; }, 0);
  }

  function startRecording() {
    const activeStream = streamRef.current;
    if (!activeStream) return;
    setElapsed(0);
    chunksRef.current = [];
    setRecordingUrl(null);
    setLifecycle('active');
    setTimerStart(Date.now());

    try {
      const preferredMimeType =
        question.type === 'audio'
          ? ['audio/webm;codecs=opus', 'audio/webm']
          : ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp8', 'video/webm'];
      const mimeType = preferredMimeType.find((t) => MediaRecorder.isTypeSupported(t));

      const recorder = new MediaRecorder(activeStream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType ?? (question.type === 'audio' ? 'audio/webm' : 'video/webm'),
        });
        setRecordingUrl(URL.createObjectURL(blob));
        setLifecycle('review');
      };
      // A timeslice forces periodic chunks — without it, some browsers omit
      // the cues/duration info a single end-of-recording chunk would need
      // for the resulting blob to report a seekable duration.
      recorder.start(1000);
      elapsedRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } catch { /* ignore */ }
  }

  function stopRecording() {
    if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop();
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    setTimerStart(null);
  }

  // Only video/audio ever reach 'thinking'/'ready'/'active' — text and
  // choice questions start directly in 'review' (see initialLifecycleState).
  function handleStart() {
    if (lifecycle === 'thinking' || lifecycle === 'ready') beginRecording();
  }

  /** "Start now" — skip the remaining countdown and record immediately. */
  function handleStartNow() {
    if (lifecycle !== 'thinking') return;
    setThinkingRemaining(0);
    setThinkingStart(null);
    beginRecording();
  }

  /** "Cancel" — abandon the countdown and return to the ready state. */
  function handleCancelCountdown() {
    if (lifecycle !== 'thinking') return;
    setThinkingStart(null);
    setThinkingRemaining(0);
    setLifecycle('ready');
  }

  /** Retry after a permission failure — re-request the stream. */
  function handleRetryPermission() {
    setMediaError(null);
    setStreamAttempt((n) => n + 1);
  }

  function handleStop() {
    stopRecording();
  }

  function handleRetake() {
    if (retakesRemaining <= 0) return;
    setRetakesUsed((p) => p + 1);
    setRecordingUrl(null);
    setElapsed(0);
    chunksRef.current = [];
    if (question.thinkingSeconds > 0) {
      setLifecycle('thinking');
      setThinkingStart(null);
    } else {
      setLifecycle('ready');
    }
  }

  function handleSubmit() {
    if (index + 1 >= questions.length) {
      setPhase('confirmation');
    } else {
      const next = questions[index + 1];
      setIndex((p) => p + 1);
      setRetakesUsed(0);
      setRecordingUrl(null);
      setElapsed(0);
      setTextContent('');
      setChoiceSelected([]);
      setLifecycle(initialLifecycleState(next));
      setThinkingStart(null);
    }
  }

  if (phase === 'confirmation') {
    return (
      <InterviewShell session={session} showProgressLine={false} practiceMode>
        <div className="iv-practice-confirm-wrap">
          <div className="iv-practice-confirm-plane iv-plane">
            <h2 className="iv-form-heading" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
              {strings.practiceReadyHeading}
            </h2>
            <p className="iv-setup-subtext">
              {strings.practiceReadyBody}
            </p>
            <div className="iv-controls-group">
              <button type="button" className="iv-cta" onClick={onComplete}>
                {strings.practiceBeginCta}
                <ArrowRight size={16} strokeWidth={1.5} className="iv-cta-arrow" />
              </button>
              <div className="iv-cta-bloom" aria-hidden="true" />
            </div>
            <button
              type="button"
              className="iv-link-button"
              onClick={() => {
                setIndex(0);
                setPhase('questions');
                setRetakesUsed(0);
                setRecordingUrl(null);
                setElapsed(0);
                setTextContent('');
                setChoiceSelected([]);
                setLifecycle(initialLifecycleState(questions[0]));
                setThinkingStart(null);
              }}
            >
              {strings.practiceAgainLink}
            </button>
          </div>
        </div>
      </InterviewShell>
    );
  }


  const timerRow = (isVideoOrAudio && (lifecycle === 'active' || lifecycle === 'warning' || lifecycle === 'thinking')) ? (
    <TimerTrack
      totalSeconds={lifecycle === 'thinking' ? question.thinkingSeconds : (question.answerSeconds ?? 0)}
      remainingMs={lifecycle === 'thinking' ? thinkingRemaining : remainingMs}
      warning={lifecycle === 'thinking' ? false : warning}
      variant={lifecycle === 'thinking' ? 'thinking' : 'recording'}
      metaLabel={
        lifecycle === 'thinking'
          ? undefined
          : strings.warningTimeRemaining(Math.max(0, Math.ceil(remainingMs / 1000)))
      }
      retakesRemaining={lifecycle === 'thinking' ? undefined : retakesRemaining}
    />
  ) : null;

  function renderAnswerSurface() {
    if (question.type === 'video') {
      return (
        <VideoRecorder
          stream={stream}
          recordingUrl={recordingUrl}
          elapsedSeconds={elapsed}
          recording={lifecycle === 'active' || lifecycle === 'warning'}
          reviewElapsed={reviewElapsed}
          reviewDuration={elapsed}
          onReviewSeek={setReviewElapsed}
          onReviewToggle={() => setReviewPlaying((p) => !p)}
          reviewPlaying={reviewPlaying}
        />
      );
    }

    if (question.type === 'audio') {
      return (
        <AudioRecorder
          stream={stream}
          recording={lifecycle === 'active' || lifecycle === 'warning'}
          reviewUrl={recordingUrl}
          reviewElapsed={reviewElapsed}
          reviewDuration={elapsed}
          onReviewSeek={setReviewElapsed}
          onReviewToggle={() => setReviewPlaying((p) => !p)}
          reviewPlaying={reviewPlaying}
        />
      );
    }

    if (question.type === 'text') {
      return (
        <TextAnswerInput
          question={question}
          value={textContent}
          onChange={setTextContent}
          disabled={false}
        />
      );
    }

    if (question.type === 'choice') {
      return (
        <ChoiceAnswer
          question={question}
          selected={choiceSelected}
          onChange={setChoiceSelected}
          disabled={false}
        />
      );
    }

    return null;
  }

  const secondaryLine =
    question.type === 'choice' && choiceSelected.length === 0
      ? strings.choiceSelectToContinue
      : question.type === 'text' && textContent.trim().length === 0
        ? strings.textWriteToContinue
        : null;

  const controlsDisabled =
    (question.type === 'choice' && choiceSelected.length === 0 && lifecycle === 'review') ||
    (question.type === 'text' && textContent.trim().length === 0 && lifecycle === 'review');

  // 2.3b — the same top progress bar the live interview uses, showing
  // Question X of Y progress through the practice set.
  const progressPercent = ((index + 1) / questions.length) * 100;

  return (
    <InterviewShell
      session={session}
      showProgressLine
      progressPercent={progressPercent}
      practiceMode
    >
      <div className="iv-question-col">
        <QuestionPanel
          question={question}
          index={index}
          total={questions.length}
        />

        {/* 2.3c — "Back to Setup" replaced by the primary forward
            action. It lives in the left column, which is otherwise
            empty below the question meta, rather than under the answer
            panel where it competed with the recording controls. */}
        <div className="iv-practice-start-row">
          <button
            type="button"
            className="iv-cta"
            onClick={() => setShowStartConfirm(true)}
          >
            {strings.practiceStartInterview}
            <ArrowRight size={16} strokeWidth={1.5} className="iv-cta-arrow" />
          </button>
        </div>
      </div>
      <div className="iv-answer-col">
        <AnswerPlane
          question={question}
          state={lifecycle}
          timerRow={timerRow}
          secondaryLine={secondaryLine}
          controls={
            <RecordingControls
              state={lifecycle}
              questionType={question.type}
              onStart={handleStart}
              onStop={handleStop}
              onSubmit={handleSubmit}
              onRetake={handleRetake}
              retakesRemaining={retakesRemaining}
              inactivityCountdown={null}
              onCancelInactivity={() => {}}
              onCancelCountdown={
                lifecycle === 'thinking' ? handleCancelCountdown : undefined
              }
              disabled={controlsDisabled}
            />
          }
        >
          {renderAnswerSurface()}

          {/* 2.3a — the countdown reaching 0 with no camera/mic shows
              this instead of silently doing nothing. */}
          {mediaError === 'permission' && (
            <div className="iv-practice-permission" role="alert">
              <p className="iv-practice-permission-title">
                {strings.practicePermissionTitle}
              </p>
              <p className="iv-practice-permission-body">
                {strings.practicePermissionBody}
              </p>
              <button
                type="button"
                className="iv-link-button"
                onClick={handleRetryPermission}
              >
                {strings.practicePermissionRetry}
              </button>
            </div>
          )}
        </AnswerPlane>
      </div>

      {showStartConfirm && (
        <div
          className="iv-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="iv-confirm-title"
          aria-describedby="iv-confirm-body"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowStartConfirm(false);
          }}
        >
          <div className="iv-confirm-dialog iv-plane">
            <h2 id="iv-confirm-title" className="iv-confirm-title">
              {strings.practiceConfirmTitle}
            </h2>
            <p id="iv-confirm-body" className="iv-confirm-body">
              {strings.practiceConfirmBody}
            </p>
            <div className="iv-confirm-actions">
              <button
                type="button"
                className="iv-confirm-secondary"
                onClick={() => setShowStartConfirm(false)}
              >
                {strings.practiceConfirmCancel}
              </button>
              <button
                type="button"
                className="iv-cta iv-confirm-primary"
                onClick={onComplete}
                autoFocus
              >
                {strings.practiceConfirmStart}
              </button>
            </div>
          </div>
        </div>
      )}
    </InterviewShell>
  );
}
