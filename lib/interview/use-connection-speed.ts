'use client';

import * as React from 'react';

/**
 * Real connection measurement for the setup page (2.2a), backed by
 * @cloudflare/speedtest — the engine behind speed.cloudflare.com.
 *
 * This replaces a homemade single-fetch probe that timed one 256KB
 * request against our own origin. That approach measured a single
 * short transfer (dominated by connection setup on fast links, and
 * unable to saturate a slow one), so its numbers were not a reliable
 * picture of the connection.
 *
 * Upload is the figure that matters here: every answer the candidate
 * records has to be uploaded, and asymmetric connections can show a
 * reassuring download speed alongside an upload that struggles.
 *
 * Privacy note: Cloudflare collects measurement results for aggregate
 * insights. If that is a blocker for EU candidates, swap the engine
 * for a self-hosted LibreSpeed instance and mention the test in the
 * privacy notice.
 */

/** Upload Mbps thresholds — the candidate is uploading video. */
export const UPLOAD_STRONG_MBPS = 5;
export const UPLOAD_ADEQUATE_MBPS = 2;
/** The minimum we surface next to the result, e.g. "24 Mbps (2 Mbps needed)". */
export const UPLOAD_REQUIRED_MBPS = UPLOAD_ADEQUATE_MBPS;

export type ConnectionStatus =
  | 'idle'
  | 'measuring'
  | 'strong'
  | 'adequate'
  | 'weak'
  | 'failed';

export interface ConnectionResult {
  /** Mbps, rounded to one decimal. Null until measured. */
  uploadMbps: number | null;
  downloadMbps: number | null;
  latencyMs: number | null;
  jitterMs: number | null;
}

const EMPTY: ConnectionResult = {
  uploadMbps: null,
  downloadMbps: null,
  latencyMs: null,
  jitterMs: null,
};

function toMbps(bitsPerSecond: number | undefined): number | null {
  if (typeof bitsPerSecond !== 'number' || !Number.isFinite(bitsPerSecond)) {
    return null;
  }
  return Math.round((bitsPerSecond / 1_000_000) * 10) / 10;
}

function round(ms: number | undefined): number | null {
  return typeof ms === 'number' && Number.isFinite(ms) ? Math.round(ms) : null;
}

/** Maps a measured upload speed onto the status tiers. */
export function statusForUpload(uploadMbps: number | null): ConnectionStatus {
  if (uploadMbps === null) return 'failed';
  if (uploadMbps >= UPLOAD_STRONG_MBPS) return 'strong';
  if (uploadMbps >= UPLOAD_ADEQUATE_MBPS) return 'adequate';
  return 'weak';
}

export function useConnectionSpeed() {
  const [status, setStatus] = React.useState<ConnectionStatus>('idle');
  const [result, setResult] = React.useState<ConnectionResult>(EMPTY);
  // Typed as unknown so the module stays dynamically imported — the
  // engine is browser-only and must not be pulled into a server bundle.
  const engineRef = React.useRef<{ pause: () => void } | null>(null);
  const liveRef = React.useRef(true);

  const stop = React.useCallback(() => {
    try {
      engineRef.current?.pause();
    } catch {
      // engine already torn down
    }
    engineRef.current = null;
  }, []);

  /** Cancels an in-flight test and returns to idle (2.2a). */
  const cancel = React.useCallback(() => {
    stop();
    if (liveRef.current) setStatus('idle');
  }, [stop]);

  const start = React.useCallback(async () => {
    stop();
    setResult(EMPTY);
    setStatus('measuring');

    try {
      const { default: SpeedTest } = await import('@cloudflare/speedtest');
      if (!liveRef.current) return;

      const engine = new SpeedTest({
        autoStart: false,
        measurements: [
          { type: 'latency', numPackets: 1 },
          { type: 'download', bytes: 1e5, count: 1 },
          { type: 'download', bytes: 1e6, count: 3 },
          { type: 'upload', bytes: 1e5, count: 3 },
          { type: 'download', bytes: 1e7, count: 2 },
          { type: 'upload', bytes: 1e6, count: 3 },
        ],
      });

      // Live figures while the test runs, so the UI never shows a
      // frozen "0 Mbps" (2.2a).
      engine.onResultsChange = () => {
        if (!liveRef.current) return;
        const s = engine.results.getSummary();
        setResult({
          uploadMbps: toMbps(s.upload),
          downloadMbps: toMbps(s.download),
          latencyMs: round(s.latency),
          jitterMs: round(s.jitter),
        });
      };

      engine.onFinish = (results) => {
        if (!liveRef.current) return;
        const s = results.getSummary();
        const upload = toMbps(s.upload);
        setResult({
          uploadMbps: upload,
          downloadMbps: toMbps(s.download),
          latencyMs: round(s.latency),
          jitterMs: round(s.jitter),
        });
        setStatus(statusForUpload(upload));
        engineRef.current = null;
      };

      engine.onError = () => {
        if (!liveRef.current) return;
        setStatus('failed');
        engineRef.current = null;
      };

      engineRef.current = engine;
      engine.play();
    } catch {
      if (liveRef.current) setStatus('failed');
    }
  }, [stop]);

  React.useEffect(() => {
    liveRef.current = true;
    return () => {
      liveRef.current = false;
      stop();
    };
  }, [stop]);

  return { status, result, start, cancel, retry: start };
}
