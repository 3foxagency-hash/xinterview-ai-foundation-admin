'use client';

import * as React from 'react';
import { strings } from '@/lib/interview/strings';
import type { SessionQuestion } from '@/config/interview-session';

export type LifecycleState =
  | 'thinking'
  | 'ready'
  | 'active'
  | 'warning'
  | 'expired'
  | 'review'
  | 'uploading'
  | 'submitted';

interface AnswerPlaneProps {
  question: SessionQuestion;
  state: LifecycleState;
  children: React.ReactNode;
  controls: React.ReactNode;
  timerRow?: React.ReactNode;
  secondaryLine?: React.ReactNode;
  statusBar?: React.ReactNode;
}

export function AnswerPlane({
  question,
  state,
  children,
  controls,
  timerRow,
  secondaryLine,
  statusBar,
}: AnswerPlaneProps) {
  const microLabel =
    question.type === 'choice'
      ? question.multiSelect
        ? strings.selectAllLabel
        : strings.selectOneLabel
      : strings.yourAnswerLabel;

  return (
    <div className="iv-answer-plane iv-plane">
      <span className="iv-micro-label">{microLabel}</span>

      <div className="iv-answer-surface">{children}</div>

      {timerRow}

      {statusBar}

      <div className="iv-answer-controls">{controls}</div>

      {secondaryLine && (
        <div className="iv-answer-secondary">{secondaryLine}</div>
      )}
    </div>
  );
}
