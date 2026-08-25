'use client';

import * as React from 'react';
import { strings } from '@/lib/interview/strings';
import type { IntegrityConfig } from '@/config/interview-session';

interface MonitoringDisclosureProps {
  integrity: IntegrityConfig;
  totalQuestions: number;
  onAcknowledge: () => void;
}

export function MonitoringDisclosure({
  integrity,
  totalQuestions,
  onAcknowledge,
}: MonitoringDisclosureProps) {
  const integrityItems: string[] = [];
  if (integrity.tabSwitchDetection) integrityItems.push(strings.disclosureTabSwitch);
  if (integrity.requireFullScreen) integrityItems.push(strings.disclosureFullScreen);
  if (integrity.disableRightClick) integrityItems.push(strings.disclosureRightClick);

  const instructionItems: string[] = [
    strings.disclosureInstructionQuestions(totalQuestions),
    strings.disclosureInstructionThinking,
    strings.disclosureInstructionRetakes,
    strings.disclosureInstructionFinal,
    strings.disclosureInstructionEnvironment,
  ];

  return (
    <div className="iv-disclosure-plane iv-plane">
      <h2 className="iv-disclosure-title">{strings.disclosureTitle}</h2>
      <p className="iv-disclosure-welcome">{strings.disclosureWelcome}</p>
      <p className="iv-disclosure-intro">{strings.disclosureWelcomeBody}</p>

      <div className="iv-disclosure-section">
        <span className="iv-micro-label">{strings.disclosureInstructionsTitle}</span>
        <ul className="iv-disclosure-list">
          {instructionItems.map((item, i) => (
            <li key={i}>
              <span className="iv-disclosure-dot" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {integrityItems.length > 0 && (
        <div className="iv-disclosure-section">
          <span className="iv-micro-label">{strings.disclosureIntegrityTitle}</span>
          <p className="iv-disclosure-intro">{strings.disclosureIntegrityIntro}</p>
          <ul className="iv-disclosure-list">
            {integrityItems.map((item, i) => (
              <li key={i}>
                <span className="iv-disclosure-dot" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
