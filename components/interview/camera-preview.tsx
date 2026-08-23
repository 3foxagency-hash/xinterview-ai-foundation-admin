'use client';

import * as React from 'react';
import { CameraOff } from 'lucide-react';
import { strings } from '@/lib/interview/strings';

export type SetupState =
  | 'checking'
  | 'ready'
  | 'denied'
  | 'no_device'
  | 'weak_connection';

interface CameraPreviewProps {
  stream: MediaStream | null;
  state: SetupState;
}

export function CameraPreview({ stream, state }: CameraPreviewProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  const showVideo =
    stream !== null && (state === 'ready' || state === 'weak_connection');

  return (
    <div
      className="iv-camera-frame"
      role="img"
      aria-label={strings.setupCameraAriaLabel}
    >
      {showVideo && (
        <>
          <video
            ref={videoRef}
            className="iv-camera-video"
            autoPlay
            playsInline
            muted
          />
          <div className="iv-camera-wash" aria-hidden="true" />
          <div className="iv-camera-live" aria-hidden="true">
            <span className="iv-camera-live-dot" />
            {strings.setupLiveLabel}
          </div>
        </>
      )}

      {!showVideo && (
        <div
          className={`iv-camera-empty ${
            state === 'checking' ? 'iv-camera-checking' : ''
          }`}
        >
          <CameraOff
            size={32}
            strokeWidth={1}
            className="iv-camera-empty-icon"
          />
        </div>
      )}
    </div>
  );
}
