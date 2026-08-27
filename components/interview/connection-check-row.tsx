'use client';

import * as React from 'react';
import { Check, TriangleAlert as AlertTriangle, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { strings } from '@/lib/interview/strings';
import type { CheckStatus } from '@/components/interview/device-check-row';
import type { ConnectionStatus as ConnectionTier } from '@/lib/interview/use-connection-speed';

interface ConnectionCheckRowProps {
  status: CheckStatus;
  uploadMbps: number | null;
  downloadMbps: number | null;
  secondaryText?: string;
  /** Measured tier (2.2a) — drives the badge wording. */
  tier?: ConnectionTier;
  latencyMs?: number | null;
  jitterMs?: number | null;
  /** Shown beside the upload figure, e.g. "(2 Mbps needed)". */
  requiredUploadMbps?: number;
  onRetry?: () => void;
  onCancel?: () => void;
}

function SpeedFigures({
  uploadMbps,
  downloadMbps,
  latencyMs,
  jitterMs,
  requiredUploadMbps,
}: {
  uploadMbps: number | null;
  downloadMbps: number | null;
  latencyMs?: number | null;
  jitterMs?: number | null;
  requiredUploadMbps?: number;
}) {
  return (
    <div className="iv-connection-speeds">
      <span className="iv-connection-speed-row">
        <ArrowUp size={13} strokeWidth={2} className="iv-connection-speed-icon" />
        <span className="iv-connection-speed-label">{strings.setupUploadLabel}</span>
        <span className="iv-connection-speed-value">
          {uploadMbps !== null ? strings.setupSpeedMbps(uploadMbps) : '—'}
        </span>
        {requiredUploadMbps !== undefined && (
          <span className="iv-connection-required">
            ({strings.setupRequiredMinimum(requiredUploadMbps)})
          </span>
        )}
      </span>
      <span className="iv-connection-speed-row">
        <ArrowDown size={13} strokeWidth={2} className="iv-connection-speed-icon" />
        <span className="iv-connection-speed-label">{strings.setupDownloadLabel}</span>
        <span className="iv-connection-speed-value">
          {downloadMbps !== null ? strings.setupSpeedMbps(downloadMbps) : '—'}
        </span>
      </span>
      {(latencyMs != null || jitterMs != null) && (
        <span className="iv-connection-speed-row">
          <Activity size={13} strokeWidth={2} className="iv-connection-speed-icon" />
          <span className="iv-connection-speed-label">{strings.setupLatencyLabel}</span>
          <span className="iv-connection-speed-value">
            {latencyMs != null ? strings.setupMs(latencyMs) : '—'}
            {jitterMs != null && (
              <span className="iv-connection-jitter">
                {' '}· {strings.setupJitterLabel} {strings.setupMs(jitterMs)}
              </span>
            )}
          </span>
        </span>
      )}
    </div>
  );
}

export function ConnectionCheckRow({
  status,
  uploadMbps,
  downloadMbps,
  secondaryText,
  tier,
  latencyMs,
  jitterMs,
  requiredUploadMbps,
  onRetry,
  onCancel,
}: ConnectionCheckRowProps) {
  const isWeak = status === 'warning';
  // Only an actually-running test shows the measuring state. A
  // cancelled test returns to 'idle', which must offer a retry rather
  // than sit on "Measuring…" forever.
  const isMeasuring = status === 'checking' && tier !== 'idle';
  const isIdle = tier === 'idle';
  const isFailed = tier === 'failed' || isIdle;

  const badgeText =
    isIdle
      ? strings.setupConnectionNotTested
      : tier === 'failed'
        ? strings.setupConnectionFailedBadge
        : tier === 'weak'
          ? strings.setupConnectionWeakBadge
          : tier === 'adequate'
            ? strings.setupConnectionAdequateBadge
            : strings.setupConnectionStrongBadge;

  const badgeClass = isFailed || isWeak ? 'weak' : 'strong';

  return (
    <div className="iv-check-row">
      <div className="iv-check-indicator">
        {status === 'checking' && (
          <div className="iv-check-circle">
            <div className="iv-check-spinner" />
          </div>
        )}
        {status === 'passed' && (
          <div className="iv-check-circle passed">
            <Check size={14} strokeWidth={2} className="iv-check-icon" />
          </div>
        )}
        {status === 'warning' && (
          <div className="iv-check-circle warning">
            <AlertTriangle size={14} strokeWidth={1.5} className="iv-check-icon-warning" />
          </div>
        )}
      </div>
      <div className="iv-check-body">
        <span className="iv-check-label">{strings.setupConnectionLabel}</span>

        {/* While measuring we still show whatever figures have arrived
            so far, so the row never sits on a frozen "0 Mbps" (2.2a). */}
        {isMeasuring ? (
          <>
            <span className="iv-check-value">{strings.setupMeasuring}</span>
            <SpeedFigures
              uploadMbps={uploadMbps}
              downloadMbps={downloadMbps}
              latencyMs={latencyMs}
              jitterMs={jitterMs}
              requiredUploadMbps={requiredUploadMbps}
            />
            {onCancel && (
              <button type="button" className="iv-link-button" onClick={onCancel}>
                {strings.setupConnectionCancel}
              </button>
            )}
          </>
        ) : (
          <>
            <span className={`iv-connection-badge ${badgeClass}`}>
              {badgeText}
            </span>
            {!isFailed && (
              <SpeedFigures
                uploadMbps={uploadMbps}
                downloadMbps={downloadMbps}
                latencyMs={latencyMs}
                jitterMs={jitterMs}
                requiredUploadMbps={requiredUploadMbps}
              />
            )}
            {isFailed && onRetry && (
              <button type="button" className="iv-link-button" onClick={onRetry}>
                {strings.setupConnectionRetry}
              </button>
            )}
          </>
        )}

        {secondaryText && (
          <span className="iv-check-value-secondary">{secondaryText}</span>
        )}
      </div>
    </div>
  );
}
