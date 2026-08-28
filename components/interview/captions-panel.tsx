'use client';

import * as React from 'react';

interface CaptionsPanelProps {
  enabled: boolean;
  lines: string[];
}

export function CaptionsPanel({ enabled, lines }: CaptionsPanelProps) {
  if (!enabled) return null;
  return (
    <div className="iv-voice-captions" aria-live="polite" aria-label="Live captions">
      {lines.slice(-3).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
    </div>
  );
}
