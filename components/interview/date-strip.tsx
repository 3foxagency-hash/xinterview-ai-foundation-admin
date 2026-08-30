'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateStripProps {
  days: Date[];
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  isDisabled?: (date: Date) => boolean;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function DateStrip({
  days,
  selectedDate,
  onSelect,
  onPrevWeek,
  onNextWeek,
  isDisabled = () => false,
}: DateStripProps) {
  return (
    <div className="iv-date-strip">
      <button
        type="button"
        className="iv-date-strip-nav"
        onClick={onPrevWeek}
        aria-label="Previous week"
      >
        <ChevronLeft size={14} strokeWidth={1.5} />
      </button>

      <div className="iv-date-cells" role="group" aria-label="Choose a date">
        {days.map((day) => {
          const selected = isSameDay(day, selectedDate);
          const disabled = isDisabled(day);
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={`iv-date-cell${selected ? ' iv-date-cell-selected' : ''}${
                disabled ? ' iv-date-cell-disabled' : ''
              }`}
              onClick={() => !disabled && onSelect(day)}
              disabled={disabled}
              aria-pressed={selected}
              aria-label={day.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            >
              <span className="iv-date-cell-weekday">
                {day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
              </span>
              <span className="iv-date-cell-day">{day.getDate()}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="iv-date-strip-nav"
        onClick={onNextWeek}
        aria-label="Next week"
      >
        <ChevronRight size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}
