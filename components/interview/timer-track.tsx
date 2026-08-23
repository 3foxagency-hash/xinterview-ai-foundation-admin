'use client';

import * as React from 'react';
import { strings } from '@/lib/interview/strings';

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

interface TimerTrackProps {
  totalSeconds: number;
  remainingMs: number;
  warning: boolean;
  ariaLive?: string;
  variant?: 'recording' | 'thinking';
}

export function TimerTrack({
  totalSeconds,
  remainingMs,
  warning,
  ariaLive,
  variant = 'recording',
}: TimerTrackProps) {
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const percent = totalSeconds > 0
    ? Math.max(0, Math.min(100, (remainingMs / 1000 / totalSeconds) * 100))
    : 0;

  const label = variant === 'thinking'
    ? strings.thinkingStartsIn(remainingSeconds)
    : formatTime(remainingSeconds);

  return (
    <div className={`iv-timer-row ${warning ? 'warning' : ''}`}>
      <div className="iv-timer-track" aria-hidden="true">
        <div
          className={`iv-timer-fill ${warning ? 'warning' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        className={`iv-timer-fig ${warning ? 'warning' : ''}`}
        aria-live="polite"
      >
        {label}
      </span>
      {ariaLive && (
        <span className="iv-sr-only" aria-live="polite">{ariaLive}</span>
      )}
    </div>
  );
}

/** Server-anchored timer hook: computes remaining time from a start
 *  timestamp so tab-throttling and clock changes can't extend a limit. */
export function useServerAnchoredTimer(
  totalSeconds: number,
  startTimestamp: number | null,
  onComplete: () => void,
) {
  const [remainingMs, setRemainingMs] = React.useState(totalSeconds * 1000);
  const completedRef = React.useRef(false);
  const rafRef = React.useRef<number>(0);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  const compute = React.useCallback(() => {
    if (startTimestamp === null) return;
    const elapsed = Date.now() - startTimestamp;
    const remaining = totalSeconds * 1000 - elapsed;
    if (remaining <= 0) {
      setRemainingMs(0);
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
    } else {
      setRemainingMs(remaining);
    }
  }, [startTimestamp, totalSeconds]);

  React.useEffect(() => {
    if (startTimestamp === null) return;
    completedRef.current = false;

    const tick = () => {
      compute();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') compute();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [startTimestamp, compute]);

  const warning = remainingMs <= 15000 && remainingMs > 0;

  return { remainingMs, warning };
}
