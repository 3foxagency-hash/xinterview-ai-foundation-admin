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
  /** Takes left, shown on the right of the meta line under the bar.
   *  Omitted (with metaLabel) the meta line is not rendered at all. */
  retakesRemaining?: number;
  /** Left side of the meta line, e.g. "1:06 remaining". */
  metaLabel?: string;
}

export function TimerTrack({
  totalSeconds,
  remainingMs,
  warning,
  ariaLive,
  variant = 'recording',
  retakesRemaining,
  metaLabel,
}: TimerTrackProps) {
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  // The bar always represents time *left*: it starts full and drains as
  // the clock runs down, so the brand colour shrinks while the empty
  // track grows. Both phases behave identically — the "Recording starts
  // in…" countdown and the answer timer — so the direction never
  // reverses between them (#4).
  //
  // percent = remaining / totalSeconds * 100, so a 100s limit loses
  // 1% per second, a 90s limit ~1.11% per second, and so on.
  const percent = totalSeconds > 0
    ? Math.max(0, Math.min(100, (remainingMs / 1000 / totalSeconds) * 100))
    : 0;


  const label = variant === 'thinking'
    ? strings.thinkingStartsIn(remainingSeconds)
    : formatTime(remainingSeconds);

  const showMeta = metaLabel !== undefined || retakesRemaining !== undefined;


  return (
    <div className="iv-timer-block">
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

      {showMeta && (
        <div className="iv-timer-meta">
          <span className={warning ? 'warning' : ''}>{metaLabel}</span>
          {retakesRemaining !== undefined && (
            <span>
              {retakesRemaining > 0
                ? strings.takesLeft(retakesRemaining)
                : strings.takesNone}
            </span>
          )}
        </div>
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

  // 2.4b — the bar and remaining-time text switch to the warning
  // colour for the last 10 seconds.
  const warning = remainingMs <= 10000 && remainingMs > 0;

  return { remainingMs, warning };
}
