'use client';

import * as React from 'react';

const ITEM_HEIGHT = 36;
const VIEWPORT_HEIGHT = 180;
/** Rendered on each side of the selected value — enough that offsets
 *  3–4 (invisible, opacity 0 per the CSS) are already in place before
 *  a multi-step scroll or a jump-click brings them into view, so the
 *  roll always looks continuous instead of items popping in. */
const WINDOW = 4;

interface TimeWheelColumnProps {
  values: number[];
  selectedValue: number;
  onChange: (value: number) => void;
  isDisabled?: (value: number) => boolean;
  format?: (value: number) => string;
  ariaLabel: string;
}

export function TimeWheelColumn({
  values,
  selectedValue,
  onChange,
  isDisabled = () => false,
  format = (v) => String(v).padStart(2, '0'),
  ariaLabel,
}: TimeWheelColumnProps) {
  const wheelAccum = React.useRef(0);
  const selectedIndex = Math.max(0, values.indexOf(selectedValue));

  const step = React.useCallback(
    (direction: 1 | -1) => {
      let candidate = selectedIndex;
      let found = false;
      while (candidate + direction >= 0 && candidate + direction < values.length) {
        candidate += direction;
        if (!isDisabled(values[candidate])) {
          found = true;
          break;
        }
      }
      if (found) onChange(values[candidate]);
    },
    [selectedIndex, values, onChange, isDisabled]
  );

  const containerRef = React.useRef<HTMLDivElement>(null);

  // A native, non-passive listener — React attaches onWheel as passive,
  // so preventDefault() inside it is silently ignored (and logs a
  // console warning) rather than stopping the page from scrolling
  // while the candidate is trying to spin this column.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      wheelAccum.current += e.deltaY;
      const threshold = 24;
      while (Math.abs(wheelAccum.current) >= threshold) {
        if (wheelAccum.current > 0) {
          step(1);
          wheelAccum.current -= threshold;
        } else {
          step(-1);
          wheelAccum.current += threshold;
        }
      }
    };
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, [step]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      step(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      step(1);
    }
  };

  // A fixed 2*WINDOW+1 slots always render — including blank slots past
  // either end of `values` — so the translateY math below never has to
  // account for a variable-length list near the boundaries.
  const slots = [];
  for (let offset = -WINDOW; offset <= WINDOW; offset++) {
    const index = selectedIndex + offset;
    const value = index >= 0 && index < values.length ? values[index] : null;
    slots.push({ offset, value });
  }

  const centerOffsetInList = WINDOW * ITEM_HEIGHT + ITEM_HEIGHT / 2;
  const translateY = VIEWPORT_HEIGHT / 2 - centerOffsetInList;

  return (
    <div
      ref={containerRef}
      className="iv-time-wheel-col"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="spinbutton"
      aria-label={ariaLabel}
      aria-valuenow={selectedValue}
      aria-valuetext={format(selectedValue)}
    >
      <div className="iv-time-wheel-list" style={{ transform: `translateY(${translateY}px)` }}>
        {slots.map(({ offset, value }) => {
          if (value === null) {
            return <div key={offset} className="iv-time-wheel-item" data-offset={Math.abs(offset)} />;
          }
          const disabled = isDisabled(value);
          return (
            <button
              key={offset}
              type="button"
              className={`iv-time-wheel-item${disabled ? ' iv-time-wheel-item-disabled' : ''}`}
              data-offset={Math.abs(offset)}
              onClick={() => !disabled && onChange(value)}
              disabled={offset === 0}
              tabIndex={-1}
              aria-hidden="true"
            >
              {format(value)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
