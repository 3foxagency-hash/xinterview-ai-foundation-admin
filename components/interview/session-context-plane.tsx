'use client';

import * as React from 'react';

interface SessionContextPlaneProps {
  expectedMinutes: number;
  recordingFailed: boolean;
}

export function SessionContextPlane({ expectedMinutes, recordingFailed }: SessionContextPlaneProps) {
  return (
    <section className="iv-voice-context" aria-label="This conversation">
      <div className="iv-voice-context-heading">
        <span className="iv-micro-label">This conversation</span>
        <span className="iv-voice-context-underline" aria-hidden="true" />
      </div>
      <div className="iv-voice-context-row">
        <span className="iv-status-dot" aria-hidden="true" />
        <span>{recordingFailed ? 'Recording could not be saved.' : 'This conversation is recorded and transcribed for the hiring team.'}</span>
      </div>
      <div className="iv-voice-context-row">
        <span className="iv-status-dot" aria-hidden="true" />
        <span>Expected duration: about {expectedMinutes} minutes.</span>
      </div>
      <div className="iv-voice-context-row">
        <span className="iv-status-dot" aria-hidden="true" />
        <span>You can end the interview at any time.</span>
      </div>
    </section>
  );
}
