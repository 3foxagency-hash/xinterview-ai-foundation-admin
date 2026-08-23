'use client';

import * as React from 'react';
import { InterviewShell } from '@/components/interview/interview-shell';
import { QuestionPanel } from '@/components/interview/question-panel';
import { AnswerPlane } from '@/components/interview/answer-plane';
import type { LifecycleState } from '@/components/interview/answer-plane';
import { TimerTrack, useServerAnchoredTimer } from '@/components/interview/timer-track';
import { RecordingControls } from '@/components/interview/recording-controls';
import { VideoRecorder } from '@/components/interview/video-recorder';
import { AudioRecorder } from '@/components/interview/audio-recorder';
import { TextAnswerInput } from '@/components/interview/text-answer-input';
import { ChoiceAnswer } from '@/components/interview/choice-answer';
import { UploadState } from '@/components/interview/upload-state';
import {
  IntegrityGuard,
  useIntegrityGuards,
} from '@/components/interview/integrity-guard';
import { MonitoringDisclosure } from '@/components/interview/monitoring-disclosure';
import { strings } from '@/lib/interview/strings';
import { CompletionScreen } from '@/components/interview/completion-screen';
import type {
  InterviewSession,
  SessionQuestion,
} from '@/config/interview-session';

interface InterviewScreenProps {
  session: InterviewSession;
  forcedQuestionIndex?: number;
  forcedState?: LifecycleState;
  forcedEndState?: 'complete' | 'already_completed' | 'expired' | 'invalid' | null;
  onComplete?: () => void;
  simFailure?: 'upload_fail' | 'network_drop' | 'permission_revoked' | 'unsupported_browser' | null;
}

type Phase = 'disclosure' | 'interview' | 'complete';

function isMediaRecorderSupported(): boolean {
  return typeof window !== 'undefined' && 'MediaRecorder' in window;
}

export function InterviewScreen({
  session,
  forcedQuestionIndex,
  forcedState,
  forcedEndState,
  onComplete,
  simFailure = null,
}: InterviewScreenProps) {
  const [phase, setPhase] = React.useState<Phase>(
    !isMediaRecorderSupported() ? 'disclosure' : 'disclosure',
  );
  const [questionIndex, setQuestionIndex] = React.useState(forcedQuestionIndex ?? 0);
  const [lifecycleState, setLifecycleState] = React.useState<LifecycleState>(
    forcedState ?? 'thinking',
  );
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = React.useState<Blob[]>([]);
  const [recordingUrl, setRecordingUrl] = React.useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [timerStart, setTimerStart] = React.useState<number | null>(null);
  const [retakesUsed, setRetakesUsed] = React.useState(0);
  const [textContent, setTextContent] = React.useState('');
  const [choiceSelected, setChoiceSelected] = React.useState<string[]>([]);
  const [uploadPercent, setUploadPercent] = React.useState(0);
  const [uploadFailed, setUploadFailed] = React.useState(false);
  const [uploadFailCount, setUploadFailCount] = React.useState(0);
  const [slowUpload, setSlowUpload] = React.useState(false);
  const [inactivityCountdown, setInactivityCountdown] = React.useState<number | null>(null);
  const [inactivityCancelled, setInactivityCancelled] = React.useState(false);
  const [reviewElapsed, setReviewElapsed] = React.useState(0);
  const [reviewPlaying, setReviewPlaying] = React.useState(false);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const elapsedIntervalRef = React.useRef<ReturnType<typeof setInterval>>(undefined);
  const inactivityTimerRef = React.useRef<ReturnType<typeof setInterval>>(undefined);
  const reviewVideoRef = React.useRef<HTMLVideoElement>(null);

  const effectiveIndex = forcedQuestionIndex ?? questionIndex;
  const question = session.questions[effectiveIndex] ?? session.questions[0];
  const totalQuestions = session.questions.length;
  const retakesRemaining = question.retakesAllowed - retakesUsed;

  const integrity = session.integrity;
  const { guard, setGuard, requestFullscreen } = useIntegrityGuards(
    integrity,
    phase === 'interview',
  );

  // Check for unsupported browser
  React.useEffect(() => {
    if (simFailure === 'unsupported_browser' || !isMediaRecorderSupported()) {
      setGuard('unsupported');
    }
  }, [simFailure, setGuard]);

  // Timer
  const { remainingMs, warning } = useServerAnchoredTimer(
    question.answerSeconds ?? 0,
    timerStart,
    () => {
      if (question.answerSeconds) {
        setLifecycleState('expired');
        stopRecording();
        setTimeout(() => setLifecycleState('review'), 1500);
      }
    },
  );

  // Thinking countdown
  const [thinkingRemaining, setThinkingRemaining] = React.useState(0);
  const [thinkingStart, setThinkingStart] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (lifecycleState !== 'thinking' || question.thinkingSeconds === 0) return;
    setThinkingStart(Date.now());
    setThinkingRemaining(question.thinkingSeconds * 1000);
  }, [lifecycleState, question.thinkingSeconds]);

  React.useEffect(() => {
    if (lifecycleState !== 'thinking' || thinkingStart === null) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - thinkingStart;
      const remaining = question.thinkingSeconds * 1000 - elapsed;
      if (remaining <= 0) {
        setThinkingRemaining(0);
        startRecording();
      } else {
        setThinkingRemaining(remaining);
      }
    }, 100);
    return () => clearInterval(id);
  }, [lifecycleState, thinkingStart, question.thinkingSeconds]);

  // Determine initial state for a question
  React.useEffect(() => {
    if (forcedState) {
      setLifecycleState(forcedState);
      return;
    }
    if (question.thinkingSeconds > 0) {
      setLifecycleState('thinking');
      setThinkingStart(null);
    } else {
      setLifecycleState('ready');
    }
    setRetakesUsed(0);
    setRecordedChunks([]);
    setRecordingUrl(null);
    setTextContent('');
    setChoiceSelected([]);
    setElapsedSeconds(0);
    setTimerStart(null);
    setInactivityCountdown(null);
    setInactivityCancelled(false);
    setReviewElapsed(0);
    setReviewPlaying(false);
  }, [effectiveIndex, forcedState]);

  // Acquire media stream for video/audio questions
  React.useEffect(() => {
    if (forcedState) return;
    if (phase !== 'interview') return;
    if (question.type !== 'video' && question.type !== 'audio') return;

    let active = true;
    const constraints: MediaStreamConstraints = {
      video: question.type === 'video',
      audio: true,
    };
    navigator.mediaDevices?.getUserMedia(constraints)
      .then((s) => { if (active) setStream(s); })
      .catch(() => {});

    return () => {
      active = false;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.type, phase, effectiveIndex]);

  // Cleanup stream on unmount
  React.useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startRecording() {
    if (!stream) return;
    setElapsedSeconds(0);
    setRecordedChunks([]);
    chunksRef.current = [];
    setRecordingUrl(null);
    setLifecycleState('active');
    setTimerStart(Date.now());

    try {
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedChunks(chunksRef.current);
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
        setLifecycleState('review');
      };
      recorder.start();

      elapsedIntervalRef.current = setInterval(() => {
        setElapsedSeconds((p) => p + 1);
      }, 1000);
    } catch {
      // MediaRecorder not available
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    if (timerStart) setTimerStart(null);
  }

  function handleStart() {
    if (lifecycleState === 'thinking') {
      startRecording();
    } else if (lifecycleState === 'ready') {
      if (question.type === 'text' || question.type === 'choice') {
        setLifecycleState('active');
        setTimerStart(Date.now());
      } else {
        startRecording();
      }
    }
  }

  function handleStop() {
    if (question.type === 'text' || question.type === 'choice') {
      setLifecycleState('review');
      if (timerStart) setTimerStart(null);
    } else {
      stopRecording();
    }
  }

  function handleRetake() {
    if (retakesRemaining <= 0) return;
    setRetakesUsed((p) => p + 1);
    setRecordingUrl(null);
    setElapsedSeconds(0);
    setRecordedChunks([]);
    chunksRef.current = [];
    setInactivityCountdown(null);
    setInactivityCancelled(false);
    if (question.thinkingSeconds > 0) {
      setLifecycleState('thinking');
      setThinkingStart(null);
    } else {
      setLifecycleState('ready');
    }
  }

  function handleSubmit() {
    if (simFailure === 'upload_fail' && uploadFailCount < 3) {
      setUploadFailed(true);
      setUploadFailCount((p) => p + 1);
      setLifecycleState('uploading');
      return;
    }
    setLifecycleState('uploading');
    setUploadFailed(false);
    setUploadPercent(0);

    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.random() * 15 + 5;
      if (pct >= 100) {
        pct = 100;
        clearInterval(interval);
        setUploadPercent(100);
        setTimeout(() => advanceQuestion(), 500);
      } else {
        setUploadPercent(pct);
        if (pct > 60 && simFailure === 'network_drop') {
          setSlowUpload(true);
        }
      }
    }, 200);
  }

  function advanceQuestion() {
    const next = effectiveIndex + 1;
    if (next >= totalQuestions) {
      setPhase('complete');
      onComplete?.();
    } else {
      if (!forcedQuestionIndex) setQuestionIndex(next);
      setLifecycleState(question.thinkingSeconds > 0 ? 'thinking' : 'ready');
    }
  }

  // Inactivity countdown in review state
  React.useEffect(() => {
    if (lifecycleState !== 'review' || inactivityCancelled) return;
    let count = 15;
    setInactivityCountdown(count);
    inactivityTimerRef.current = setInterval(() => {
      count--;
      setInactivityCountdown(count);
      if (count <= 0) {
        clearInterval(inactivityTimerRef.current);
        handleSubmit();
      }
    }, 1000);
    return () => clearInterval(inactivityTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifecycleState, inactivityCancelled]);

  function cancelInactivity() {
    setInactivityCancelled(true);
    setInactivityCountdown(null);
    if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
  }

  // Review playback
  React.useEffect(() => {
    if (lifecycleState !== 'review' || !reviewPlaying || !recordingUrl) return;
    const interval = setInterval(() => {
      setReviewElapsed((p) => p + 0.25);
    }, 250);
    return () => clearInterval(interval);
  }, [lifecycleState, reviewPlaying, recordingUrl]);

  // Handle forced end state
  if (forcedEndState) {
    return (
      <CompletionScreenInternal
        session={session}
        state={forcedEndState}
      />
    );
  }

  if (phase === 'complete') {
    return (
      <CompletionScreenInternal session={session} state="complete" />
    );
  }

  if (phase === 'disclosure') {
    const hasIntegrity = integrity.tabSwitchDetection || integrity.requireFullScreen || integrity.disableRightClick;
    if (!hasIntegrity) {
      setPhase('interview');
      requestFullscreen();
      return null;
    }
    return (
      <InterviewShell session={session} showProgressLine={false}>
        <div className="iv-disclosure-wrap">
          <MonitoringDisclosure
            integrity={integrity}
            onAcknowledge={() => {
              setPhase('interview');
              requestFullscreen();
            }}
          />
        </div>
      </InterviewShell>
    );
  }

  const progressPercent = (effectiveIndex / totalQuestions) * 100;
  const isVideoOrAudio = question.type === 'video' || question.type === 'audio';
  const effectiveState = forcedState ?? lifecycleState;

  const timerRow = (isVideoOrAudio && (effectiveState === 'active' || effectiveState === 'warning' || effectiveState === 'thinking')) ? (
    <TimerTrack
      totalSeconds={effectiveState === 'thinking' ? question.thinkingSeconds : (question.answerSeconds ?? 0)}
      remainingMs={effectiveState === 'thinking' ? thinkingRemaining : remainingMs}
      warning={effectiveState === 'thinking' ? false : warning}
      variant={effectiveState === 'thinking' ? 'thinking' : 'recording'}
    />
  ) : null;

  const statusBar =
    simFailure === 'network_drop' && effectiveState === 'active' ? (
      <div className="iv-status-bar warning">
        {strings.errorNetworkDrop}
      </div>
    ) : simFailure === 'permission_revoked' && effectiveState === 'active' ? (
      <div className="iv-status-bar warning">
        {strings.errorPermissionRevoked}
        <button className="iv-link-button" onClick={() => setGuard('unsupported')}>
          {strings.errorPermissionRecheck}
        </button>
      </div>
    ) : null;

  function renderAnswerSurface() {
    if (effectiveState === 'uploading') {
      return (
        <UploadState
          percent={uploadPercent}
          slowConnection={slowUpload}
          failed={uploadFailed}
          failureCount={uploadFailCount}
          onRetry={handleSubmit}
          onContinueWithout={advanceQuestion}
        />
      );
    }

    if (question.type === 'video') {
      return (
        <VideoRecorder
          stream={stream}
          recordingUrl={recordingUrl}
          elapsedSeconds={elapsedSeconds}
          recording={effectiveState === 'active' || effectiveState === 'warning'}
          reviewElapsed={reviewElapsed}
          reviewDuration={question.answerSeconds ?? elapsedSeconds}
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
          recording={effectiveState === 'active' || effectiveState === 'warning'}
          reviewUrl={recordingUrl}
          reviewElapsed={reviewElapsed}
          reviewDuration={question.answerSeconds ?? elapsedSeconds}
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
          storageKey={`iv-draft-${question.id}`}
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
      : null;

  const controlsDisabled =
    (question.type === 'choice' && choiceSelected.length === 0 && effectiveState === 'review');

  return (
    <InterviewShell
      session={session}
      progressPercent={progressPercent}
    >
      <div className="iv-question-col">
        <QuestionPanel
          question={question}
          index={effectiveIndex}
          total={totalQuestions}
        />
      </div>
      <div className="iv-answer-col">
        <AnswerPlane
          question={question}
          state={effectiveState}
          timerRow={timerRow}
          statusBar={statusBar}
          controls={
            <RecordingControls
              state={effectiveState}
              questionType={question.type}
              onStart={handleStart}
              onStop={handleStop}
              onSubmit={handleSubmit}
              onRetake={handleRetake}
              retakesRemaining={retakesRemaining}
              inactivityCountdown={inactivityCountdown}
              onCancelInactivity={cancelInactivity}
              disabled={controlsDisabled}
            />
          }
          secondaryLine={secondaryLine}
        >
          {renderAnswerSurface()}
        </AnswerPlane>
      </div>

      {guard && (
        <IntegrityGuard
          type={guard}
          onContinue={() => setGuard(null)}
        />
      )}
    </InterviewShell>
  );
}

function CompletionScreenInternal({
  session,
  state,
}: {
  session: InterviewSession;
  state: 'complete' | 'already_completed' | 'expired' | 'invalid';
}) {
  return <CompletionScreen session={session} state={state} />;
}
