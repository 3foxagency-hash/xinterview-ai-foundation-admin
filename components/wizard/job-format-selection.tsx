'use client';

import * as React from 'react';
import { Lock, Check, CircleAlert as AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INTERVIEW_FORMAT_CONFIG, type FormatConfig } from '@/lib/constants/interview-formats';
import type { InterviewFormat } from '@/lib/validation/job';

interface JobFormatSelectionProps {
  selected: InterviewFormat;
  onSelect: (format: InterviewFormat) => void;
  onContinue: () => void;
}

function FormatCardContent({
  card,
  selected,
}: {
  card: FormatConfig;
  selected: boolean;
}) {
  const Icon = card.icon;
  return (
    <>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors',
            selected ? 'border-primary bg-primary/10' : 'border-border bg-card-hover'
          )}
        >
          <Icon size={20} strokeWidth={1.5} className={selected ? 'text-primary' : 'text-bodyText'} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-h3 text-heading">{card.name}</h3>
            {card.recommended && (
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-active-menu-bg px-2 py-0.5 text-caption font-medium text-primary">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-1 text-body-sm text-muted">{card.description}</p>
        </div>
        <div
          className={cn(
            'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            selected ? 'border-primary bg-primary' : 'border-border-strong'
          )}
          aria-hidden
        >
          {selected && <Check size={12} className="text-primary-foreground" strokeWidth={3} />}
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <ul className="space-y-2">
          {card.benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-body-sm text-bodyText">
              <Check size={14} className="shrink-0 text-success" strokeWidth={2} />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function JobFormatSelection({ selected, onSelect, onContinue }: JobFormatSelectionProps) {
  const [lockedPopover, setLockedPopover] = React.useState<string | null>(null);
  const radioGroupRef = React.useRef<HTMLDivElement>(null);
  const selectableFormats = INTERVIEW_FORMAT_CONFIG.filter((f) => !f.locked && !f.setupRequired);

  const selectableCards = INTERVIEW_FORMAT_CONFIG.filter(
    (f) => !f.locked && !f.setupRequired
  );
  const cardRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % selectableCards.length;
      cardRefs.current[nextIndex]?.focus();
      onSelect(selectableCards[nextIndex].id);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + selectableCards.length) % selectableCards.length;
      cardRefs.current[prevIndex]?.focus();
      onSelect(selectableCards[prevIndex].id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-h1 text-heading">How do you want to interview candidates?</h1>
        <p className="mt-2 text-body-lg text-muted">
          This sets how candidates answer. You can&apos;t change it after you create the job.
        </p>
      </div>

      <div
        ref={radioGroupRef}
        role="radiogroup"
        aria-label="Interview format"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {INTERVIEW_FORMAT_CONFIG.map((card) => {
          const isLocked = card.locked;
          const needsSetup = card.setupRequired;
          const isSelectable = !isLocked && !needsSetup;
          const isSelected = selected === card.id;

          if (isLocked) {
            return (
              <div key={card.id} className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setLockedPopover(lockedPopover === card.id ? null : card.id)
                  }
                  aria-label={`${card.name} — locked`}
                  className="flex w-full flex-col rounded-lg border border-border bg-surface p-5 text-left opacity-60 transition-opacity hover:opacity-70"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-card-hover">
                      <card.icon size={20} strokeWidth={1.5} className="text-muted" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-h3 text-heading">{card.name}</h3>
                        <Lock size={14} className="text-muted" />
                      </div>
                      <p className="mt-1 text-body-sm text-muted">{card.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-border pt-4">
                    <span className="inline-flex items-center gap-1.5 text-body-sm font-medium text-primary">
                      <Lock size={12} /> Upgrade
                    </span>
                  </div>
                </button>
                {lockedPopover === card.id && (
                  <div
                    role="tooltip"
                    className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-lg border border-border bg-surface p-4 shadow-lg"
                  >
                    <p className="text-body-sm text-heading">{card.lockReason}</p>
                    <a
                      href="/settings/billing"
                      className="mt-2 inline-block text-body-sm font-medium text-primary hover:underline"
                    >
                      See plans
                    </a>
                    <button
                      type="button"
                      onClick={() => setLockedPopover(null)}
                      className="mt-3 block text-caption text-muted hover:text-heading"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            );
          }

          if (needsSetup) {
            return (
              <div
                key={card.id}
                className="flex w-full flex-col rounded-lg border border-border bg-surface p-5 text-left opacity-70"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-card-hover">
                    <card.icon size={20} strokeWidth={1.5} className="text-muted" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-h3 text-heading">{card.name}</h3>
                    <p className="mt-1 text-body-sm text-muted">{card.description}</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-body-sm text-warning">
                    <AlertCircle size={14} />
                    <span>{needsSetup.label}</span>
                    <a
                      href={needsSetup.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 font-medium text-primary hover:underline"
                    >
                      Set up →
                    </a>
                  </div>
                </div>
              </div>
            );
          }

          const selectableIndex = selectableCards.findIndex((c) => c.id === card.id);
          return (
            <button
              key={card.id}
              ref={(el) => {
                cardRefs.current[selectableIndex] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(card.id)}
              onKeyDown={(e) => handleKeyDown(e, selectableIndex)}
              className={cn(
                'flex w-full flex-col rounded-lg border p-5 text-left transition-all',
                isSelected
                  ? 'border-primary bg-active-menu-bg shadow-sm'
                  : 'border-border bg-surface hover:border-primary/30 hover:shadow-sm'
              )}
            >
              <FormatCardContent card={card} selected={isSelected} />
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-info-border bg-info-wash px-4 py-3">
        <p className="text-body-sm text-info-ink">
          <span className="font-semibold">Important.</span> The interview format you select
          determines the type of questions you can ask in the next step.
        </p>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectableFormats.some((f) => f.id === selected)}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-button text-primary-foreground shadow-md transition-all hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
