'use client';

import * as React from 'react';
import { strings } from '@/lib/interview/strings';
import type { IntegrityConfig } from '@/config/interview-session';

interface MonitoringDisclosureProps {
  integrity: IntegrityConfig;
  onAcknowledge: () => void;
}

export function MonitoringDisclosure({
  integrity,
  onAcknowledge,
}: MonitoringDisclosureProps) {
  const items: string[] = [];
  if (integrity.tabSwitchDetection) items.push(strings.disclosureTabSwitch);
  if (integrity.requireFullScreen) items.push(strings.disclosureFullScreen);
  if (integrity.disableRightClick) items.push(strings.disclosureRightClick);

  if (items.length === 0) return null;

  return (
    <div className="iv-disclosure-plane iv-plane">
      <h2 className="iv-disclosure-title">{strings.disclosureTitle}</h2>
      <p className="iv-disclosure-intro">{strings.disclosureIntro}</p>
      <ul className="iv-disclosure-list">
        {items.map((item, i) => (
          <li key={i}>
            <span className="iv-disclosure-dot" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="iv-controls-group">
        <button
          type="button"
          className="iv-cta"
          onClick={onAcknowledge}
        >
          {strings.disclosureAcknowledge}
          <span className="iv-cta-arrow" />
        </button>
        <div className="iv-cta-bloom" aria-hidden="true" />
      </div>
    </div>
  );
}
