'use client';

import * as React from 'react';
import { strings } from '@/lib/interview/strings';
import type { SessionQuestion } from '@/config/interview-session';

function questionTier(text: string): string {
  const len = text.length;
  if (len < 60) return 'iv-q-tier-1';
  if (len < 110) return 'iv-q-tier-2';
  if (len < 180) return 'iv-q-tier-3';
  return 'iv-q-tier-4';
}

function metaItems(q: SessionQuestion): string[] {
  const items: string[] = [];
  if (q.type === 'video') items.push(strings.metaVideo);
  else if (q.type === 'audio') items.push(strings.metaAudio);
  else if (q.type === 'text') items.push(strings.metaText);
  else items.push(strings.metaChoice);

  if (q.answerSeconds) items.push(strings.metaUpTo(q.answerSeconds));
  if (q.retakesAllowed > 0) items.push(strings.metaTakes(q.retakesAllowed));
  if (q.type === 'text' && q.maxCharacters) items.push(strings.metaCharacters(q.maxCharacters));

  return items;
}

function sanitiseHtml(html: string): string {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

interface QuestionPanelProps {
  question: SessionQuestion;
  index: number;
  total: number;
}

export function QuestionPanel({ question, index, total }: QuestionPanelProps) {
  const tier = questionTier(question.text);
  const items = metaItems(question);
  const hasDescription = !!question.descriptionHtml;

  return (
    <div className="iv-question-panel">
      <div className="iv-question-eyebrow">
        <span className="iv-question-dot" aria-hidden="true" />
        <span className="iv-micro-label">
          {strings.questionOf(index + 1, total)}
        </span>
      </div>

      <h2 className={`iv-question-text ${tier}`}>
        {question.text}
      </h2>

      {hasDescription && (
        <div className="iv-question-desc-wrap">
          {/* Shown in full — see 2.4a. The expander that used to sit
              here only existed to reveal text hidden by a max-height
              and gradient fade; with nothing clipped it had no state
              to toggle into. */}
          <div
            className="iv-question-desc"
            dangerouslySetInnerHTML={{
              __html: sanitiseHtml(question.descriptionHtml!),
            }}
          />
        </div>
      )}

      <hr className="iv-hairline" />

      <div className="iv-meta-row">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            <span className="iv-meta-item">{item}</span>
            {i < items.length - 1 && (
              <span className="iv-meta-divider" aria-hidden="true" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
