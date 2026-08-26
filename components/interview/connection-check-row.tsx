'use client';

import * as React from 'react';
import { Check, TriangleAlert as AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { strings } from '@/lib/interview/strings';
import type { CheckStatus } from '@/components/interview/device-check-row';

interface ConnectionCheckRowProps {
  status: CheckStatus;
  uploadMbps: number | null;
  downloadMbps: number | null;
  secondaryText?: string;
}

export function ConnectionCheckRow({
  status,
  uploadMbps,
  downloadMbps,
  secondaryText,
}: ConnectionCheckRowProps) {
  const isWeak = status === 'warning';

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

        {status === 'checking' ? (
          <span className="iv-check-value">{strings.setupCheckingLabel}</span>
        ) : (
          <>
            <span className={`iv-connection-badge ${isWeak ? 'weak' : 'strong'}`}>
              {isWeak ? strings.setupConnectionWeakBadge : strings.setupConnectionStrongBadge}
            </span>
            <div className="iv-connection-speeds">
              <span className="iv-connection-speed-row">
                <ArrowUp size={13} strokeWidth={2} className="iv-connection-speed-icon" />
                <span className="iv-connection-speed-label">{strings.setupUploadLabel}</span>
                <span className="iv-connection-speed-value">
                  {uploadMbps !== null ? strings.setupSpeedMbps(uploadMbps) : '—'}
                </span>
              </span>
              <span className="iv-connection-speed-row">
                <ArrowDown size={13} strokeWidth={2} className="iv-connection-speed-icon" />
                <span className="iv-connection-speed-label">{strings.setupDownloadLabel}</span>
                <span className="iv-connection-speed-value">
                  {downloadMbps !== null ? strings.setupSpeedMbps(downloadMbps) : '—'}
                </span>
              </span>
            </div>
          </>
        )}

        {secondaryText && (
          <span className="iv-check-value-secondary">{secondaryText}</span>
        )}
      </div>
    </div>
  );
}
