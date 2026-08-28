'use client';

import * as React from 'react';
import type { AvatarQualityTier } from './avatar-types';
import type { VoiceTurnState } from './voice-types';

interface AvatarStreamRenderProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  ready: boolean;
}

interface AvatarStreamManagerProps {
  quality: AvatarQualityTier;
  state: VoiceTurnState;
  audioEnabled: boolean;
  simulatedFailure: boolean;
  onReady: () => void;
  onStream: (stream: MediaStream | null) => void;
  onStall: () => void;
  children: (props: AvatarStreamRenderProps) => React.ReactNode;
}

const avatarSource = '/videos/intro-sample.mp4';

export function AvatarStreamManager({
  quality,
  state,
  audioEnabled,
  simulatedFailure,
  onReady,
  onStream,
  onStall,
  children,
}: AvatarStreamManagerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [ready, setReady] = React.useState(false);
  const stallTimerRef = React.useRef<number | null>(null);
  const streamSentRef = React.useRef(false);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = audioEnabled ? 1 : 0;
    if (quality === 'audio_only' || simulatedFailure) {
      video.pause();
      return;
    }
    video.playbackRate = quality === 'reduced' ? 0.92 : 1;
    void video.play().catch(() => {});
  }, [audioEnabled, quality, simulatedFailure, state]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const markReady = () => {
      setReady(true);
      onReady();
      if (!streamSentRef.current) {
        const capture = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream;
        if (capture) {
          onStream(capture.call(video));
          streamSentRef.current = true;
        }
      }
    };
    const markStalled = () => {
      if (stallTimerRef.current !== null) window.clearTimeout(stallTimerRef.current);
      stallTimerRef.current = window.setTimeout(onStall, 2000);
    };
    const clearStall = () => {
      if (stallTimerRef.current !== null) window.clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    };
    video.addEventListener('loadeddata', markReady);
    video.addEventListener('canplay', markReady);
    video.addEventListener('waiting', markStalled);
    video.addEventListener('stalled', markStalled);
    video.addEventListener('playing', clearStall);
    video.src = avatarSource;
    video.load();
    return () => {
      video.removeEventListener('loadeddata', markReady);
      video.removeEventListener('canplay', markReady);
      video.removeEventListener('waiting', markStalled);
      video.removeEventListener('stalled', markStalled);
      video.removeEventListener('playing', clearStall);
      if (stallTimerRef.current !== null) window.clearTimeout(stallTimerRef.current);
      onStream(null);
    };
  }, [onReady, onStall, onStream]);

  React.useEffect(() => {
    if (!simulatedFailure) return;
    onStall();
  }, [onStall, simulatedFailure]);

  return <>{children({ videoRef, ready: ready && !simulatedFailure })}</>;
}
