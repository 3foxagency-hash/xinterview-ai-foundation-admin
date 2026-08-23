'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';

export interface DeviceOption {
  deviceId: string;
  label: string;
}

interface DeviceSelectorProps {
  options: DeviceOption[];
  value: string;
  onChange: (deviceId: string) => void;
  disabled?: boolean;
  ariaLabel: string;
}

export function DeviceSelector({
  options,
  value,
  onChange,
  disabled,
  ariaLabel,
}: DeviceSelectorProps) {
  return (
    <div className="iv-device-selector">
      <select
        className="iv-device-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || options.length === 0}
        aria-label={ariaLabel}
      >
        {options.length === 0 ? (
          <option value="">{ariaLabel}</option>
        ) : (
          options.map((opt) => (
            <option key={opt.deviceId} value={opt.deviceId}>
              {opt.label}
            </option>
          ))
        )}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={1.5}
        className="iv-device-chevron"
        aria-hidden="true"
      />
    </div>
  );
}
