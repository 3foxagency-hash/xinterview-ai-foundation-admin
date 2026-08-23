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
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.pause();
      setPlaying(false);
    } else {
      v.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [playing]);

  return (
    <div>
      <div className="iv-video-frame" onClick={handlePlay}>
        {playing ? (
          <video
            ref={videoRef}
            className="iv-video-element"
            src={video.url}
            poster={video.posterUrl}
            controls
            playsInline
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <>
            <img
              className="iv-video-poster"
              src={video.posterUrl}
              alt=""
            />
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
