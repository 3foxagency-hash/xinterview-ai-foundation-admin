'use client';

/* Interview viewing primitives shared by the internal job page and the public
   share page. Both render the same player, question rail and answer modal;
   only the surrounding chrome and the available actions differ. */

import * as React from 'react';
import { AlignLeft, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, ListChecks, Maximize2, Mic, Pause, Phone, Play, ShieldAlert, Sparkles, Star, Video, Volume2, VolumeX, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { interviewQuestions, type FlagSeverity, type InterviewQuestion, type McqOption, type QuestionType } from '@/lib/workflow-mock';
import { cn } from '@/lib/utils';

export function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

/* A real player rather than a decorative poster: it drives an actual <video>,
   so play/pause, seek, mute, speed and fullscreen do what they say. No media
   ships with the mock data, so it falls back to the poster plus a synthetic
   clock — every readout comes from element state (or that fallback), so the
   moment `src` is a real URL the same controls drive real media unchanged. */
export function VideoPlayer({ duration, seconds }: { duration: string; seconds: number }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  const [captions, setCaptions] = React.useState(true);
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => { setElapsed(0); setPlaying(false); }, [duration]);

  React.useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setElapsed((current) => {
        const video = videoRef.current;
        if (video && video.duration) return video.currentTime;
        if (current + 0.25 >= seconds) { setPlaying(false); return seconds; }
        return current + 0.25;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [playing, seconds]);

  React.useEffect(() => { const v = videoRef.current; if (v) v.playbackRate = rate; }, [rate]);
  React.useEffect(() => { const v = videoRef.current; if (v) v.muted = muted; }, [muted]);

  const togglePlay = () => setPlaying((current) => {
    const next = !current;
    const v = videoRef.current;
    if (v?.currentSrc) { if (next) void v.play(); else v.pause(); }
    return next;
  });

  const seek = (value: number) => { setElapsed(value); const v = videoRef.current; if (v?.currentSrc) v.currentTime = value; };

  const toggleFullscreen = () => {
    const frame = frameRef.current;
    if (!frame) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frame.requestFullscreen?.().catch(() => toast('Fullscreen is unavailable here'));
  };

  return <div ref={frameRef} className="overflow-hidden rounded-lg border border-border bg-black">
    <div className="relative aspect-video w-full">
      <video ref={videoRef} className="h-full w-full object-cover" poster="/candidate-aarav-portrait.webp" playsInline onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)} onEnded={() => setPlaying(false)} />
      {!playing && <button type="button" onClick={togglePlay} aria-label="Play answer" className="absolute inset-0 flex items-center justify-center transition-colors hover:bg-black/10"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-glass-bg-strong backdrop-blur"><Play className="ml-1 h-7 w-7 fill-text-inverse text-text-inverse" aria-hidden="true" /></span></button>}
    </div>
    <div className="px-3 pb-3 pt-2">
      {/* A real range input, so seeking is keyboard-operable and exposed. */}
      <input type="range" min={0} max={seconds} step={0.25} value={elapsed} onChange={(event) => seek(Number(event.target.value))} aria-label="Seek" className="video-scrubber w-full" style={{ '--progress': `${seconds > 0 ? (elapsed / seconds) * 100 : 0}%` } as React.CSSProperties} />
      <div className="mt-2 flex items-center justify-between gap-3 text-caption text-text-inverse">
        <div className="flex items-center gap-3">
          <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause answer' : 'Play answer'} className="rounded-sm p-1 transition-colors hover:bg-glass-bg">{playing ? <Pause className="h-4 w-4 fill-current" aria-hidden="true" /> : <Play className="h-4 w-4 fill-current" aria-hidden="true" />}</button>
          <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? 'Unmute' : 'Mute'} className="rounded-sm p-1 transition-colors hover:bg-glass-bg">{muted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}</button>
          <span className="tabular">{formatTime(elapsed)} / {duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setRate((v) => (v === 2 ? 0.5 : v === 0.5 ? 1 : v === 1 ? 1.5 : 2))} aria-label={`Playback speed ${rate}x`} className="rounded-sm px-1.5 py-1 tabular transition-colors hover:bg-glass-bg">{rate.toFixed(1)}x</button>
          <button type="button" onClick={() => setCaptions((v) => !v)} aria-pressed={captions} aria-label="Toggle captions" className={cn('rounded-xs border px-1 py-0.5 transition-colors', captions ? 'border-text-inverse bg-glass-bg-strong' : 'border-text-inverse/40 hover:bg-glass-bg')}>CC</button>
          <button type="button" onClick={toggleFullscreen} aria-label="Toggle fullscreen" className="rounded-sm p-1 transition-colors hover:bg-glass-bg"><Maximize2 className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  </div>;
}

/* A deterministic "waveform": bar heights are derived from the question's
   duration rather than randomised on every render, so the same answer always
   draws the same shape and re-renders don't make it jitter. */
function waveformBars(seconds: number, count: number) {
  const seed = Math.max(1, Math.round(seconds * 100));
  return Array.from({ length: count }, (_, index) => {
    const value = Math.sin(seed * (index + 1) * 12.9898) * 43758.5453;
    const frac = value - Math.floor(value);
    return 18 + Math.round(frac * 82);
  });
}

/* Same transport chrome as VideoPlayer (scrubber, play/pause, mute, speed,
   elapsed/duration) so switching between question types never reflows the
   surrounding layout — only the CC/fullscreen controls are dropped, since
   neither applies to audio, and a waveform stands in for the video frame. */
export function AudioPlayer({ duration, seconds }: { duration: string; seconds: number }) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => { setElapsed(0); setPlaying(false); }, [duration]);

  React.useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setElapsed((current) => {
        const audio = audioRef.current;
        if (audio && audio.duration) return audio.currentTime;
        if (current + 0.25 >= seconds) { setPlaying(false); return seconds; }
        return current + 0.25;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [playing, seconds]);

  React.useEffect(() => { const a = audioRef.current; if (a) a.playbackRate = rate; }, [rate]);
  React.useEffect(() => { const a = audioRef.current; if (a) a.muted = muted; }, [muted]);

  const togglePlay = () => setPlaying((current) => {
    const next = !current;
    const a = audioRef.current;
    if (a?.currentSrc) { if (next) void a.play(); else a.pause(); }
    return next;
  });

  const seek = (value: number) => { setElapsed(value); const a = audioRef.current; if (a?.currentSrc) a.currentTime = value; };

  const bars = React.useMemo(() => waveformBars(seconds, 56), [seconds]);
  const progress = seconds > 0 ? elapsed / seconds : 0;

  return <div className="overflow-hidden rounded-lg border border-border bg-black">
    <div className="relative flex aspect-video w-full items-center justify-center px-6">
      <audio ref={audioRef} onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)} onEnded={() => setPlaying(false)} />
      <div className="flex h-16 w-full max-w-md items-center justify-center gap-[3px]" aria-hidden="true">
        {bars.map((height, index) => {
          const played = bars.length > 0 && index / bars.length < progress;
          return <span key={index} className={cn('flex-1 rounded-full bg-text-inverse transition-opacity', played ? 'opacity-100' : 'opacity-25')} style={{ height: `${height}%` }} />;
        })}
      </div>
      {!playing && <button type="button" onClick={togglePlay} aria-label="Play answer" className="absolute inset-0 flex items-center justify-center transition-colors hover:bg-black/10"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-glass-bg-strong backdrop-blur"><Play className="ml-1 h-7 w-7 fill-text-inverse text-text-inverse" aria-hidden="true" /></span></button>}
      <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-glass-bg-strong px-2 py-1 text-caption text-text-inverse backdrop-blur"><Mic className="h-3.5 w-3.5" aria-hidden="true" />Audio answer</span>
    </div>
    <div className="px-3 pb-3 pt-2">
      <input type="range" min={0} max={seconds} step={0.25} value={elapsed} onChange={(event) => seek(Number(event.target.value))} aria-label="Seek" className="video-scrubber w-full" style={{ '--progress': `${seconds > 0 ? (elapsed / seconds) * 100 : 0}%` } as React.CSSProperties} />
      <div className="mt-2 flex items-center justify-between gap-3 text-caption text-text-inverse">
        <div className="flex items-center gap-3">
          <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause answer' : 'Play answer'} className="rounded-sm p-1 transition-colors hover:bg-glass-bg">{playing ? <Pause className="h-4 w-4 fill-current" aria-hidden="true" /> : <Play className="h-4 w-4 fill-current" aria-hidden="true" />}</button>
          <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? 'Unmute' : 'Mute'} className="rounded-sm p-1 transition-colors hover:bg-glass-bg">{muted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}</button>
          <span className="tabular">{formatTime(elapsed)} / {duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setRate((v) => (v === 2 ? 0.5 : v === 0.5 ? 1 : v === 1 ? 1.5 : 2))} aria-label={`Playback speed ${rate}x`} className="rounded-sm px-1.5 py-1 tabular transition-colors hover:bg-glass-bg">{rate.toFixed(1)}x</button>
        </div>
      </div>
    </div>
  </div>;
}

/* The full phone-interview call recording. Same transport chrome as
   AudioPlayer, but it is not an answer to a question — it stands alone in
   the first slot of a Phone Screening interview, so the badge reads
   "Phone interview recording" rather than "Audio answer" and it accepts a
   real `url` since the backend supplies one file per interview rather than
   one per question. */
export function PhoneRecordingPlayer({ url, duration, seconds }: { url?: string; duration: string; seconds: number }) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setElapsed((current) => {
        const audio = audioRef.current;
        if (audio && audio.duration) return audio.currentTime;
        if (current + 0.25 >= seconds) { setPlaying(false); return seconds; }
        return current + 0.25;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [playing, seconds]);

  React.useEffect(() => { const a = audioRef.current; if (a) a.playbackRate = rate; }, [rate]);
  React.useEffect(() => { const a = audioRef.current; if (a) a.muted = muted; }, [muted]);

  const togglePlay = () => setPlaying((current) => {
    const next = !current;
    const a = audioRef.current;
    if (a?.currentSrc) { if (next) void a.play(); else a.pause(); }
    return next;
  });

  const seek = (value: number) => { setElapsed(value); const a = audioRef.current; if (a?.currentSrc) a.currentTime = value; };

  const bars = React.useMemo(() => waveformBars(seconds, 56), [seconds]);
  const progress = seconds > 0 ? elapsed / seconds : 0;

  return <div className="overflow-hidden rounded-lg border border-border bg-black">
    <div className="relative flex aspect-video w-full items-center justify-center px-6">
      <audio ref={audioRef} src={url} onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)} onEnded={() => setPlaying(false)} />
      <div className="flex h-16 w-full max-w-md items-center justify-center gap-[3px]" aria-hidden="true">
        {bars.map((height, index) => {
          const played = bars.length > 0 && index / bars.length < progress;
          return <span key={index} className={cn('flex-1 rounded-full bg-text-inverse transition-opacity', played ? 'opacity-100' : 'opacity-25')} style={{ height: `${height}%` }} />;
        })}
      </div>
      {!playing && <button type="button" onClick={togglePlay} aria-label="Play phone interview recording" className="absolute inset-0 flex items-center justify-center transition-colors hover:bg-black/10"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-glass-bg-strong backdrop-blur"><Play className="ml-1 h-7 w-7 fill-text-inverse text-text-inverse" aria-hidden="true" /></span></button>}
      <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-glass-bg-strong px-2 py-1 text-caption text-text-inverse backdrop-blur"><Phone className="h-3.5 w-3.5" aria-hidden="true" />Phone interview recording</span>
    </div>
    <div className="px-3 pb-3 pt-2">
      <input type="range" min={0} max={seconds} step={0.25} value={elapsed} onChange={(event) => seek(Number(event.target.value))} aria-label="Seek" className="video-scrubber w-full" style={{ '--progress': `${seconds > 0 ? (elapsed / seconds) * 100 : 0}%` } as React.CSSProperties} />
      <div className="mt-2 flex items-center justify-between gap-3 text-caption text-text-inverse">
        <div className="flex items-center gap-3">
          <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause recording' : 'Play recording'} className="rounded-sm p-1 transition-colors hover:bg-glass-bg">{playing ? <Pause className="h-4 w-4 fill-current" aria-hidden="true" /> : <Play className="h-4 w-4 fill-current" aria-hidden="true" />}</button>
          <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? 'Unmute' : 'Mute'} className="rounded-sm p-1 transition-colors hover:bg-glass-bg">{muted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}</button>
          <span className="tabular">{formatTime(elapsed)} / {duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setRate((v) => (v === 2 ? 0.5 : v === 0.5 ? 1 : v === 1 ? 1.5 : 2))} aria-label={`Playback speed ${rate}x`} className="rounded-sm px-1.5 py-1 tabular transition-colors hover:bg-glass-bg">{rate.toFixed(1)}x</button>
        </div>
      </div>
    </div>
  </div>;
}

/* Fixed-height text card matching the video/audio frame exactly; long
   answers scroll inside rather than growing the card, so the surrounding
   layout never reflows regardless of answer length. */
export function TextAnswer({ text }: { text: string }) {
  return <div className="overflow-hidden rounded-lg border border-border bg-surface-2">
    <div className="aspect-video w-full overflow-y-auto overscroll-contain p-5">
      <p className="whitespace-pre-line text-body-lg leading-relaxed text-bodyText">{text}</p>
    </div>
  </div>;
}

/* Up to 4 options. The candidate's pick and the correct option are both
   marked independently, because they may not be the same one: a wrong pick
   still needs to show what was chosen (error tint) alongside what was
   actually correct (success tint), even when nothing was clicked at all. */
export function McqAnswer({ options, selectedOptionId, correctOptionId }: { options: McqOption[]; selectedOptionId?: string; correctOptionId?: string }) {
  return <div className="overflow-hidden rounded-lg border border-border bg-surface-2">
    <div className="flex aspect-video w-full flex-col justify-center gap-2.5 p-5">
      {options.map((option) => {
        const isSelected = option.id === selectedOptionId;
        const isCorrect = option.id === correctOptionId;
        return <div key={option.id} className={cn('flex items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors', isCorrect ? 'border-success-border bg-success-wash' : isSelected ? 'border-error-border bg-error-wash' : 'border-border bg-surface')}>
          <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', isCorrect ? 'border-success bg-success text-success-foreground' : isSelected ? 'border-error bg-error text-error-foreground' : 'border-border-strong bg-surface text-transparent')}>
            {isCorrect ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : isSelected ? <X className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          </span>
          <span className={cn('text-body-sm', isCorrect ? 'font-medium text-success-ink' : isSelected ? 'font-medium text-error-ink' : 'text-bodyText')}>{option.label}</span>
          {isSelected && isCorrect && <span className="ml-auto shrink-0 text-caption font-medium text-success-ink">Correct · Candidate&apos;s answer</span>}
          {isSelected && !isCorrect && <span className="ml-auto shrink-0 text-caption font-medium text-error-ink">Candidate&apos;s answer</span>}
          {isCorrect && !isSelected && <span className="ml-auto shrink-0 text-caption font-medium text-success-ink">Correct answer</span>}
        </div>;
      })}
    </div>
  </div>;
}

/* Picks the right player/answer view for a question's type, so callers don't
   branch on `question.type` themselves — VideoPlayer stays the default for
   older mock data that predates the `type` field. */
export function AnswerPlayer({ question }: { question: InterviewQuestion }) {
  switch (question.type) {
    case 'phone_recording': return <PhoneRecordingPlayer url={question.recordingUrl} duration={question.duration} seconds={question.seconds} />;
    case 'audio': return <AudioPlayer duration={question.duration} seconds={question.seconds} />;
    case 'text': return <TextAnswer text={question.transcript ?? question.answer} />;
    case 'mcq': return question.options ? <McqAnswer options={question.options} selectedOptionId={question.selectedOptionId} correctOptionId={question.correctOptionId} /> : null;
    default: return <VideoPlayer duration={question.duration} seconds={question.seconds} />;
  }
}

const PIP_WINDOW = 5;

export function QuestionPips({ total, current, onSelect }: { total: number; current: number; onSelect: (index: number) => void }) {
  if (total <= PIP_WINDOW) {
    return <div className="hidden items-center gap-1 lg:flex">
      {Array.from({ length: total }, (_, index) => (
        <button type="button" key={index} onClick={() => onSelect(index)} aria-label={`Go to question ${index + 1}`} aria-current={index === current ? 'true' : undefined} className={cn('h-1.5 rounded-full transition-all', index === current ? 'w-6 bg-primary' : 'w-4 bg-surface-2 hover:bg-border-strong')} />
      ))}
    </div>;
  }

  const half = Math.floor(PIP_WINDOW / 2);
  const start = Math.min(Math.max(current - half, 0), total - PIP_WINDOW);
  const windowed = Array.from({ length: PIP_WINDOW }, (_, i) => start + i);

  return <div className="hidden items-center gap-1.5 lg:flex">
    {start > 0 && <span className="h-1 w-1 shrink-0 rounded-full bg-border-strong" aria-hidden="true" />}
    <div className="flex items-center gap-1">
      {windowed.map((index) => (
        <button type="button" key={index} onClick={() => onSelect(index)} aria-label={`Go to question ${index + 1}`} aria-current={index === current ? 'true' : undefined} className={cn('h-1.5 rounded-full transition-all', index === current ? 'w-6 bg-primary' : 'w-4 bg-surface-2 hover:bg-border-strong')} />
      ))}
    </div>
    {start + PIP_WINDOW < total && <span className="h-1 w-1 shrink-0 rounded-full bg-border-strong" aria-hidden="true" />}
  </div>;
}

export function QuestionNav({ questionIndex, onQuestionChange, total = interviewQuestions.length }: { questionIndex: number; onQuestionChange: (index: number) => void; total?: number }) {
  return <div className="flex shrink-0 items-center gap-2">
    <div className="flex items-center gap-1">
      <Button variant="secondary" size="icon-sm" aria-label="Previous question" disabled={questionIndex === 0} onClick={() => onQuestionChange(questionIndex - 1)}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></Button>
      <Button variant="secondary" size="icon-sm" aria-label="Next question" disabled={questionIndex === total - 1} onClick={() => onQuestionChange(questionIndex + 1)}><ChevronRight className="h-4 w-4" aria-hidden="true" /></Button>
    </div>
    <QuestionPips total={total} current={questionIndex} onSelect={onQuestionChange} />
  </div>;
}

export function FlagDot({ severity }: { severity: FlagSeverity }) {
  return <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold leading-none', severity === 'high' ? 'bg-error text-error-foreground' : 'bg-warning text-warning-foreground')} aria-label={severity === 'high' ? 'Flagged' : 'Needs a look'}>!</span>;
}

const QUESTION_TYPE_META: Record<QuestionType, { label: string; icon: typeof Video }> = {
  video: { label: 'Video', icon: Video },
  audio: { label: 'Audio', icon: Mic },
  mcq: { label: 'MCQ', icon: ListChecks },
  text: { label: 'Text', icon: AlignLeft },
  phone_recording: { label: 'Recording', icon: Phone },
};

/* Defaults to 'video' — the rail can't tell an unset type from an actual
   video answer, and every mock question predating the `type` field is one. */
export function QuestionTypeBadge({ type }: { type?: QuestionType }) {
  const { label, icon: Icon } = QUESTION_TYPE_META[type ?? 'video'];
  return <span className="flex shrink-0 items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-caption font-medium text-muted"><Icon className="h-3 w-3" aria-hidden="true" />{label}</span>;
}

/* The full answer: the recording and its transcript side by side, so a
   reviewer can read along or re-watch without leaving the question. */
export function AnswerModal({ question, onClose }: { question: InterviewQuestion | null; onClose: () => void }) {
  const isRecording = question?.type === 'phone_recording';
  return <Dialog open={Boolean(question)} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2">
          {isRecording ? <span className="text-h3">Phone interview recording</span> : <>
            <span className="rounded-md bg-primary-soft px-2 py-1 text-caption font-semibold text-primary-ink">Q{question?.number}</span>
            <span className="text-h3">{question?.text}</span>
          </>}
        </DialogTitle>
        <DialogDescription className="flex flex-wrap items-center gap-2 pt-1">
          {question?.type !== 'mcq' && <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-caption"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{isRecording ? 'Length' : 'Answer'}: {question?.duration}</span>}
          {question?.flagged && <span className={cn('flex items-center gap-1 rounded-full px-2 py-1 text-caption font-medium', question.flagged === 'high' ? 'bg-error-wash text-error-ink' : 'bg-warning-wash text-warning-ink')}><ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />AI Flagged</span>}
        </DialogDescription>
      </DialogHeader>
      {question && (question.type === 'text' || question.type === 'mcq' || isRecording ? (
        <AnswerPlayer question={question} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <AnswerPlayer question={question} />
          <div className="flex min-h-0 flex-col rounded-lg border border-border bg-surface-2/60 p-4">
            <p className="text-caption font-medium uppercase tracking-wide text-muted">Transcript</p>
            <div className="mt-2 max-h-72 overflow-y-auto overscroll-contain pr-1">
              <p className="whitespace-pre-line text-body-sm leading-relaxed text-bodyText">{question.transcript ?? question.answer}</p>
            </div>
          </div>
        </div>
      ))}
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

export function QuestionRail({ questionIndex, onQuestionChange, questions = interviewQuestions }: { questionIndex: number; onQuestionChange: (index: number) => void; questions?: InterviewQuestion[] }) {
  const [expanded, setExpanded] = React.useState(false);
  const [answerOpen, setAnswerOpen] = React.useState<InterviewQuestion | null>(null);
  const active = questions[questionIndex];
  const activeIsRecording = active.type === 'phone_recording';
  const rest = questions.filter((_, index) => index !== questionIndex);
  const visible = expanded ? rest : rest.slice(questionIndex, questionIndex + 3);

  return <aside className="hidden min-h-0 min-w-0 flex-col gap-3 overflow-y-auto overscroll-contain border-l border-border bg-surface p-4 xl:flex">
    {/* The question being watched is an open panel, not another card in the
        stack, so it is never mistaken for a jump target. */}
    <div className="rounded-lg border border-primary/20 bg-primary-soft p-3">
      <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-caption font-semibold text-primary-ink">{activeIsRecording ? 'Now playing' : `Q${active.number} · Now playing`}<QuestionTypeBadge type={active.type} /></span><span className="flex items-center gap-2 text-caption tabular text-muted">{active.type !== 'mcq' && active.duration}{active.flagged && <FlagDot severity={active.flagged} />}</span></div>
      {activeIsRecording ? (
        <p className="mt-2 text-body-sm font-medium text-heading">Phone interview recording</p>
      ) : (
        <>
          <p className="mt-2 text-body-sm font-medium text-heading">{active.text}</p>
          <p className="mt-2 line-clamp-3 text-caption font-normal text-muted">{active.answer}</p>
        </>
      )}
      <button type="button" className="mt-2 text-caption font-medium text-primary-ink hover:underline" onClick={() => setAnswerOpen(active)}>{activeIsRecording ? 'Open recording' : 'View full answer'}</button>
    </div>

    {visible.map((question) => {
      const index = questions.findIndex((item) => item.id === question.id);
      const isRecording = question.type === 'phone_recording';
      return <button key={question.id} type="button" onClick={() => onQuestionChange(index)} className="rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-border-hover hover:bg-surface-hover">
        <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-caption font-semibold text-heading">{isRecording ? null : `Q${question.number}`}<QuestionTypeBadge type={question.type} /></span><span className="flex items-center gap-2 text-caption tabular text-muted">{question.type !== 'mcq' && question.duration}{question.flagged && <FlagDot severity={question.flagged} />}</span></div>
        {isRecording ? (
          <p className="mt-2 text-body-sm font-medium text-heading">Phone interview recording</p>
        ) : (
          <>
            <p className="mt-2 text-body-sm font-medium text-heading">{question.text}</p>
            <p className="mt-1.5 line-clamp-2 text-caption font-normal text-muted">{question.answer}</p>
          </>
        )}
      </button>;
    })}

    <Button variant="secondary" className="w-full justify-between" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>{expanded ? 'Show fewer questions' : `View all questions (${questions.length})`}<ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" /></Button>
    <AnswerModal question={answerOpen} onClose={() => setAnswerOpen(null)} />

  </aside>;
}

/* Read-only star row. `value` may be fractional (an average), so each star
   is filled only when the value clears it. */

export function Stars({ value, className }: { value: number; className?: string }) {
  return <span className={cn('flex items-center gap-0.5', className)} aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((step) => <Star key={step} className={cn('h-3.5 w-3.5', value >= step - 0.5 ? 'fill-warning text-warning' : 'fill-none text-border-strong')} aria-hidden="true" />)}
  </span>;
}
