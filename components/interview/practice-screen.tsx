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
import type { InterviewSession } from '@/config/interview-session';

interface PracticeScreenProps {
  session: InterviewSession;
  onComplete: () => void;
  onBack: () => void;
}

type PracticePhase = 'questions' | 'confirmation';

export function PracticeScreen({ session, onComplete, onBack }: PracticeScreenProps) {
  const [phase, setPhase] = React.useState<PracticePhase>('questions');
  const [index, setIndex] = React.useState(0);
  const [lifecycle, setLifecycle] = React.useState<LifecycleState>(() =>
    initialLifecycleState(session.practice.questions[0]),
  );
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [timerStart, setTimerStart] = React.useState<number | null>(null);
  const [retakesUsed, setRetakesUsed] = React.useState(0);
  const [recordingUrl, setRecordingUrl] = React.useState<string | null>(null);
  const [reviewPlaying, setReviewPlaying] = React.useState(false);
  const [reviewElapsed, setReviewElapsed] = React.useState(0);
  const [thinkingRemaining, setThinkingRemaining] = React.useState(0);
  const [thinkingStart, setThinkingStart] = React.useState<number | null>(null);
  const [textContent, setTextContent] = React.useState('');
  const [choiceSelected, setChoiceSelected] = React.useState<string[]>([]);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const elapsedRef = React.useRef<ReturnType<typeof setInterval>>(undefined);

  const questions = session.practice.questions;
  const question = questions[index];
  const retakesRemaining = question.retakesAllowed - retakesUsed;
  const isVideoOrAudio = question.type === 'video' || question.type === 'audio';

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

  React.useEffect(() => {
    if (lifecycle !== 'thinking' || thinkingStart === null) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifecycle, thinkingStart, question.thinkingSeconds]);

  // Acquire media stream only for video/audio questions.
  React.useEffect(() => {
    if (!isVideoOrAudio) return;
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
  }, [question.type, index]);

  React.useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startRecording() {
    if (!stream) return;
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

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
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
    if (lifecycle === 'thinking' || lifecycle === 'ready') startRecording();
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
          storageKey={`iv-practice-draft-${question.id}`}
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

  return (
    <InterviewShell session={session} showProgressLine={false} practiceMode>
      <div className="iv-question-col">
        <QuestionPanel
          question={question}
          index={index}
          total={questions.length}
        />
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
              disabled={controlsDisabled}
            />
          }
        >
          {renderAnswerSurface()}
        </AnswerPlane>
      </div>
      <div className="iv-practice-back">
        <button type="button" className="iv-link-button" onClick={onBack}>
          {strings.practiceBackLink}
        </button>
      </div>
    </InterviewShell>
  );
}
