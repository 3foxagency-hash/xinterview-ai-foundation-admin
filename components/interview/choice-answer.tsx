'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { strings } from '@/lib/interview/strings';
import type { SessionQuestion, ChoiceOption } from '@/config/interview-session';

interface ChoiceAnswerProps {
  question: SessionQuestion;
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

export function ChoiceAnswer({
  question,
  selected,
  onChange,
  disabled,
}: ChoiceAnswerProps) {
  const multiSelect = question.multiSelect ?? false;
  const options = question.options ?? [];
  const name = `question-${question.id}`;

  const handleSingle = (id: string) => {
    if (disabled) return;
    onChange([id]);
  };

  const handleMulti = (id: string) => {
    if (disabled) return;
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  };

  return (
    <fieldset className="iv-choice-fieldset" disabled={disabled}>
      <legend className="iv-sr-only">{question.text}</legend>
      {options.map((opt, i) => {
        const isSelected = selected.includes(opt.id);
        return (
          <React.Fragment key={opt.id}>
            <label
              className={`iv-choice-row ${isSelected ? 'selected' : ''}`}
            >
              {multiSelect ? (
                <input
                  type="checkbox"
                  name={name}
                  value={opt.id}
                  checked={isSelected}
                  onChange={() => handleMulti(opt.id)}
                  className="iv-choice-checkbox"
                  aria-label={opt.label}
                />
              ) : (
                <input
                  type="radio"
                  name={name}
                  value={opt.id}
                  checked={isSelected}
                  onChange={() => handleSingle(opt.id)}
                  className="iv-choice-radio"
                  aria-label={opt.label}
                />
              )}
              <span className="iv-choice-indicator" aria-hidden="true">
                {multiSelect && isSelected && (
                  <Check size={12} strokeWidth={2.5} className="iv-choice-check" />
                )}
                {!multiSelect && isSelected && (
                  <span className="iv-choice-dot" />
                )}
              </span>
              <span className="iv-choice-label">{opt.label}</span>
            </label>
            {i < options.length - 1 && (
              <hr className="iv-choice-divider" aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </fieldset>
  );
}
