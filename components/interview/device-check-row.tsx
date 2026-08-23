'use client';

import * as React from 'react';
import { Check, TriangleAlert as AlertTriangle } from 'lucide-react';
import { DeviceSelector, type DeviceOption } from '@/components/interview/device-selector';

export type CheckStatus = 'checking' | 'passed' | 'warning';

interface DeviceCheckRowProps {
  label: string;
  status: CheckStatus;
  ariaLabel: string;
  selectorOptions?: DeviceOption[];
  selectorValue?: string;
  onSelectorChange?: (deviceId: string) => void;
  selectorDisabled?: boolean;
  valueText?: string;
  secondaryText?: string;
}

export function DeviceCheckRow({
  label,
  status,
  ariaLabel,
  selectorOptions,
  selectorValue,
  onSelectorChange,
  selectorDisabled,
  valueText,
  secondaryText,
}: DeviceCheckRowProps) {
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
            <Check
              size={14}
              strokeWidth={2}
              className="iv-check-icon"
            />
          </div>
        )}
        {status === 'warning' && (
          <div className="iv-check-circle warning">
            <AlertTriangle
              size={14}
              strokeWidth={1.5}
              className="iv-check-icon-warning"
            />
          </div>
        )}
      </div>
      <div className="iv-check-body">
        <span className="iv-check-label">{label}</span>
        {selectorOptions ? (
          <DeviceSelector
            options={selectorOptions}
            value={selectorValue ?? ''}
            onChange={onSelectorChange ?? (() => {})}
            disabled={selectorDisabled}
            ariaLabel={ariaLabel}
          />
        ) : (
          <>
            <span className="iv-check-value">{valueText}</span>
            {secondaryText && (
              <span className="iv-check-value-secondary">
                {secondaryText}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
