'use client';

import * as React from 'react';
import { GripVertical, Pencil, Copy, Trash2, ChevronUp, ChevronDown, MoveVertical as MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  QUESTION_TYPE_CONFIG,
  parseTimeToSeconds,
  type QuestionType,
} from '@/lib/constants/question-types';
import type { Question } from '@/lib/api/jobs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface QuestionRowProps {
  question: Question;
  index: number;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onKeyboardGrab: () => void;
  onKeyboardMove: (direction: 'up' | 'down') => void;
  onKeyboardDrop: () => void;
  onKeyboardCancel: () => void;
  isKeyboardGrabbing: boolean;
}

function SettingsChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 text-caption text-muted">
      {label}
    </span>
  );
}

function formatThinkingLabel(value: string | undefined): string | null {
  if (!value || value === 'none') return null;
  if (value === '15s') return '15s think';
  if (value === '30s') return '30s think';
  if (value === '60s') return '60s think';
  if (value === '2min') return '2 min think';
  return value;
}

function formatAnswerLabel(value: string | undefined): string | null {
  if (!value) return null;
  if (value === '30s') return '30s answer';
  if (value === '1min') return '1 min answer';
  if (value === '2min') return '2 min answer';
  if (value === '3min') return '3 min answer';
  if (value === '5min') return '5 min answer';
  return value;
}

function formatRetriesLabel(value: number | undefined): string | null {
  if (value === undefined || value === 0) return null;
  if (value === 1) return '1 retry';
  return `${value} retries`;
}

export function QuestionRow({
  question,
  index,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onEdit,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onKeyboardGrab,
  onKeyboardMove,
  onKeyboardDrop,
  onKeyboardCancel,
  isKeyboardGrabbing,
}: QuestionRowProps) {
  const typeConfig = QUESTION_TYPE_CONFIG[question.type as QuestionType];
  const TypeIcon = typeConfig.icon;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isKeyboardGrabbing) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onKeyboardGrab();
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onKeyboardMove('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onKeyboardMove('down');
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onKeyboardDrop();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onKeyboardCancel();
    }
  };

  const chips: string[] = [];
  const thinkLabel = formatThinkingLabel(question.thinkingTime);
  if (thinkLabel) chips.push(thinkLabel);
  const answerLabel = formatAnswerLabel(question.answerTime);
  if (answerLabel) chips.push(answerLabel);
  const retriesLabel = formatRetriesLabel(question.retakesAllowed);
  if (retriesLabel) chips.push(retriesLabel);

  const title = question.title.trim() || 'Untitled question';

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        'group relative rounded-lg border bg-surface transition-all',
        isDragging && 'opacity-40',
        isDropTarget && 'border-primary border-2',
        !isDragging && !isDropTarget && 'border-border',
        isKeyboardGrabbing && 'ring-2 ring-primary'
      )}
    >
      {isDropTarget && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 rounded-full bg-primary" aria-hidden />
      )}
      <div className="flex items-center gap-3 p-3">
        {/* Drag handle */}
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onKeyDown={handleKeyDown}
          aria-label={
            isKeyboardGrabbing
              ? `Reordering question ${index + 1}. Press up or down to move, space to drop, escape to cancel.`
              : `Grab to reorder question ${index + 1}. Press space to start keyboard reordering.`
          }
          className={cn(
            'flex h-8 w-6 shrink-0 cursor-grab items-center justify-center text-muted transition-colors hover:text-bodyText focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing',
            isKeyboardGrabbing && 'text-primary'
          )}
        >
          <GripVertical size={16} />
        </button>

        {/* Position number */}
        <span className="w-5 shrink-0 text-center text-body-sm font-semibold tabular-nums text-muted">
          {index + 1}
        </span>

        {/* Type indicator */}
        <div className="flex shrink-0 items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
              typeConfig.tileClass,
              typeConfig.colorClass
            )}
          >
            <TypeIcon size={14} strokeWidth={1.5} />
          </div>
          <span className={cn('hidden text-body-sm font-medium sm:inline', typeConfig.colorClass)}>
            {typeConfig.label}
          </span>
        </div>

        {/* Title with tooltip */}
        <TooltipProvider delayDuration={500}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="min-w-0 flex-1 truncate text-body text-heading">
                {title}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Settings chips */}
        <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
          {chips.map((chip) => (
            <SettingsChip key={chip} label={chip} />
          ))}
        </div>

        {/* Row actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit question ${index + 1}`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-card-hover hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            aria-label={`Duplicate question ${index + 1}`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-card-hover hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Copy size={15} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete question ${index + 1}`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-wash hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 size={15} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`More actions for question ${index + 1}`}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-card-hover hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MoreVertical size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onMoveUp} disabled={index === 0}>
                <ChevronUp size={14} /> Move up
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMoveDown}>
                <ChevronDown size={14} /> Move down
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Settings chips — visible on narrow screens */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 pb-3 lg:hidden">
          {chips.map((chip) => (
            <SettingsChip key={chip} label={chip} />
          ))}
        </div>
      )}
    </div>
  );
}
