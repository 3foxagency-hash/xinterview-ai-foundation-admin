'use client';

import * as React from 'react';
import { strings } from '@/lib/interview/strings';
import type { InterviewConfig } from '@/config/interview.mock';

interface IntroVideoProps {
  video: NonNullable<InterviewConfig['introVideo']>;
}

export function IntroVideo({ video }: IntroVideoProps) {
  const [playing, setPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handlePlay = React.useCallback(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <div>
      {/* Once playing, native <video controls> owns play/pause toggling —
          clicking the frame here would double-toggle against it (the
          browser's own controls already respond to a click on the video
          surface, not just the control bar). */}
      <div className="iv-video-frame" onClick={playing ? undefined : handlePlay}>
        <video
          ref={videoRef}
          className="iv-video-element"
          src={video.url}
          controls={playing}
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />

        {!playing && (
          <>
            <div className="iv-video-wash" aria-hidden="true" />
            <button
              type="button"
              className="iv-video-play"
              aria-label={strings.videoPlayLabel}
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
            >
              <span className="iv-video-play-icon" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <div className="iv-video-meta">
        <span className="iv-video-presenter">
          {strings.videoPresenter(video.presenterName, video.presenterTitle)}
        </span>
        <span className="iv-video-duration">{video.durationLabel}</span>
      </div>
    </div>
  );
}
