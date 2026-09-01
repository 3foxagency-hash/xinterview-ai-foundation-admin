'use client';

import * as React from 'react';
import { Lock, Check, CircleAlert as AlertCircle, Info, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionCard } from '@/components/wizard/section-card';
import { Popover, PopoverTrigger, PopoverClose, PopoverContent } from '@/components/ui/popover';
import { INTERVIEW_FORMAT_CONFIG, type FormatConfig } from '@/lib/constants/interview-formats';
import type { InterviewFormat } from '@/lib/validation/job';

interface JobFormatSelectionProps {
  selected: InterviewFormat;
  onSelect: (format: InterviewFormat) => void;
  onContinue: () => void;
}

const TONE_TILE: Record<FormatConfig['tone'], string> = {
  settings: 'bg-settings-wash text-settings-ink',
  jobs: 'bg-jobs-wash text-jobs-ink',
  reports: 'bg-reports-wash text-reports-ink',
  ai: 'bg-ai-wash text-ai-ink',
  candidates: 'bg-candidates-wash text-candidates-ink',
  interviews: 'bg-interviews-wash text-interviews-ink',
};

function FormatCardContent({ card, selected }: { card: FormatConfig; selected: boolean }) {
  const Icon = card.icon;
  return (
    <div className="flex items-start gap-4">
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors',
          selected ? 'border-primary bg-primary/10' : cn('border-transparent', TONE_TILE[card.tone])
        )}
      >
        <Icon size={22} className={selected ? 'text-primary' : undefined} />
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
  );
}

function LockedFormatCard({ card }: { card: FormatConfig }) {
  const Icon = card.icon;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${card.name} — locked`}
          className="flex w-full flex-col rounded-lg border border-border bg-surface p-5 text-left opacity-70 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <div className="flex items-start gap-4">
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', TONE_TILE[card.tone])}>
              <Icon size={22} />
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card-hover px-2.5 py-1 text-caption font-medium text-muted">
              <Lock size={12} /> Available on {card.lockPlan}
            </span>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <p className="text-body-sm text-heading">{card.lockReason}</p>
        <p className="mt-1.5 text-body-sm text-muted">Available on the {card.lockPlan} plan.</p>
        <div className="mt-3 flex items-center gap-4">
          <a
            href="/settings/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-body-sm font-medium text-primary hover:underline"
          >
            See plans
          </a>
          <PopoverClose asChild>
            <button type="button" className="text-body-sm text-muted hover:text-heading">
              Dismiss
            </button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SetupRequiredFormatCard({ card }: { card: FormatConfig }) {
  const Icon = card.icon;
  const setupRequired = card.setupRequired;
  if (!setupRequired) return null;
  return (
    <div className="flex w-full flex-col rounded-lg border border-border bg-surface p-5 text-left opacity-80">
      <div className="flex items-start gap-4">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', TONE_TILE[card.tone])}>
          <Icon size={22} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <h3 className="text-h3 text-heading">{card.name}</h3>
          <p className="mt-1 text-body-sm text-muted">{card.description}</p>
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-1.5 text-body-sm text-warning">
          <AlertCircle size={14} className="shrink-0" />
          <span>{setupRequired.label}</span>
          <a
            href={setupRequired.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Set up →
          </a>
        </div>
      </div>
    </div>
  );
}

export function JobFormatSelection({ selected, onSelect, onContinue }: JobFormatSelectionProps) {
  const selectableCards = INTERVIEW_FORMAT_CONFIG.filter((f) => !f.locked && !f.setupRequired);
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

  const canContinue = selectableCards.some((f) => f.id === selected);

  return (
    <div className="space-y-6 pb-24 sm:pb-6">
      <div className="text-center">
        <h1 className="text-h1 text-heading">How do you want to interview candidates?</h1>
        <p className="mt-2 text-body-lg text-muted">Choose the interview format for this job.</p>
        <p className="text-body-lg text-muted">
          This determines how candidates respond and which question types are available.
        </p>
      </div>

      <SectionCard
        title="Interview format"
        description="Choose the format that best fits this role"
        footer={
          <div className="flex items-start gap-2.5 rounded-lg border border-info-border bg-info-wash px-4 py-3">
            <Info size={16} className="mt-0.5 shrink-0 text-info-ink" />
            <p className="text-body-sm text-info-ink">
              The interview format you select determines the type of questions you can ask in the
              next step.
            </p>
          </div>
        }
      >
        <div
          role="radiogroup"
          aria-label="Interview format"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 min-[1600px]:grid-cols-4"
        >
          {INTERVIEW_FORMAT_CONFIG.map((card) => {
            if (card.locked) {
              return <LockedFormatCard key={card.id} card={card} />;
            }

            if (card.setupRequired) {
              return <SetupRequiredFormatCard key={card.id} card={card} />;
            }

            const isSelected = selected === card.id;
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
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
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
      </SectionCard>

      <div className="fixed inset-x-0 bottom-0 z-topbar border-t border-border bg-surface p-4 sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-button text-primary-foreground shadow-sm transition-all hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:w-auto"
          >
            Continue
            <ArrowRight size={16} strokeWidth={2} />
          </button>
          <p className="text-caption text-muted">You can change this until the job is created.</p>
        </div>
      </div>
    </div>
  );
}
