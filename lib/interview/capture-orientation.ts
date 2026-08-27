'use client';

import * as React from 'react';

/**
 * Capture orientation for recorded answers (2.7).
 *
 * Mobile records portrait (9:16) and desktop stays landscape (16:9).
 * The decision comes from viewport width plus `pointer: coarse` — not
 * from user-agent sniffing, which misreports tablets, desktop touch
 * screens, and anything with a spoofed UA string.
 */

export type CaptureOrientation = 'portrait' | 'landscape';

const MOBILE_MAX_WIDTH = 767;

export function detectOrientation(): CaptureOrientation {
  if (typeof window === 'undefined') return 'landscape';
  const narrow = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return narrow && coarse ? 'portrait' : 'landscape';
}

/** Video constraints for the given orientation. */
export function videoConstraintsFor(
  orientation: CaptureOrientation,
  deviceId?: string,
): MediaTrackConstraints {
  const base: MediaTrackConstraints =
    orientation === 'portrait'
      ? {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 1280 },
          aspectRatio: { ideal: 9 / 16 },
        }
      : {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16 / 9 },
        };

  // An exact deviceId (from the setup page's picker) must win over
  // facingMode, which would otherwise fight it on multi-camera phones.
  if (deviceId) {
    const { facingMode: _facingMode, ...rest } = base;
    return { ...rest, deviceId: { exact: deviceId } };
  }
  return base;
}

/** Live orientation, re-evaluated on resize/rotate. */
export function useCaptureOrientation(): CaptureOrientation {
  const [orientation, setOrientation] = React.useState<CaptureOrientation>(
    () => detectOrientation(),
  );

  React.useEffect(() => {
    const update = () => setOrientation(detectOrientation());
    update();
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    mq.addEventListener('change', update);
    window.addEventListener('orientationchange', update);
    return () => {
      mq.removeEventListener('change', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return orientation;
}
