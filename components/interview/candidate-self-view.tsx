'use client';

import * as React from 'react';
import { CameraOff } from 'lucide-react';

interface CandidateSelfViewProps {
  stream: MediaStream | null;
  active: boolean;
  disconnected?: boolean;
}

export function CandidateSelfView({ stream, active, disconnected = false }: CandidateSelfViewProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) video.play().catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <div className={`iv-voice-self-view ${active ? 'is-speaking' : ''} ${disconnected ? 'is-disconnected' : ''}`}>
      {stream && !disconnected ? (
        <>
          <video ref={videoRef} autoPlay muted playsInline aria-label="Your live camera view" />
          <span className="iv-voice-self-wash" aria-hidden="true" />
        </>
      ) : (
        <div className="iv-voice-self-empty" role="img" aria-label="Camera unavailable">
          <CameraOff size={24} strokeWidth={1.25} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
