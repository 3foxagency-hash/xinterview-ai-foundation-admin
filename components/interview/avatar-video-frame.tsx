'use client';

import * as React from 'react';
import { AiDisclosureBadge } from './ai-disclosure-badge';
import type { AvatarQualityTier } from './avatar-types';
import type { VoiceTurnState } from './voice-types';

interface AvatarVideoFrameProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  state: VoiceTurnState;
  quality: AvatarQualityTier;
  ready: boolean;
  audioEnabled: boolean;
  label?: string;
}

export function AvatarVideoFrame({
  videoRef,
  state,
  quality,
  ready,
  audioEnabled,
  label = 'AI interviewer video',
}: AvatarVideoFrameProps) {
  return (
    <div className={`iv-avatar-video-frame iv-avatar-video-${state} iv-avatar-quality-${quality} ${ready ? 'is-ready' : 'is-buffering'}`}>
      <video
        ref={videoRef}
        className="iv-avatar-video"
        aria-label={label}
        autoPlay
        playsInline
        loop
        muted={!audioEnabled}
        preload="auto"
      />
      <span className="iv-avatar-wash" aria-hidden="true" />
      <AiDisclosureBadge />
      {!ready && <span className="iv-avatar-buffering-copy">Connecting</span>}
      {quality === 'audio_only' && <span className="iv-avatar-audio-only-copy">Video paused to keep the audio clear</span>}
    </div>
  );
}
