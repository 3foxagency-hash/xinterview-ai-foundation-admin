'use client';

import * as React from 'react';
import type { VoiceTurnState } from './voice-types';

interface TurnStatusProps {
  state: VoiceTurnState;
  side: 'agent' | 'candidate';
}

const labels: Record<VoiceTurnState, { agent: string; candidate: string }> = {
  agent_speaking: { agent: 'Speaking', candidate: 'Listening' },
  candidate_speaking: { agent: 'Listening', candidate: 'Speaking' },
  agent_thinking: { agent: 'Thinking', candidate: 'Paused' },
  connecting: { agent: 'Connecting', candidate: 'Paused' },
};

export function TurnStatus({ state, side }: TurnStatusProps) {
  return <span className="iv-voice-turn-status">{labels[state][side]}</span>;
}

export function VoiceLiveRegion({ state }: { state: VoiceTurnState }) {
  const message = state === 'agent_speaking'
    ? 'Interviewer is speaking'
    : state === 'candidate_speaking'
      ? 'Your turn'
      : state === 'agent_thinking'
        ? 'Interviewer is thinking'
        : 'Connecting to the interviewer';
  return <div className="iv-sr-only" aria-live="polite" aria-atomic="true">{message}</div>;
}
