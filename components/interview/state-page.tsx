'use client';

import { strings } from '@/lib/interview/strings';
import type { InterviewState } from '@/config/interview.mock';

interface StatePageProps {
  state: Exclude<InterviewState, 'active'>;
  companyName: string;
}

export function StatePage({ state, companyName }: StatePageProps) {
  let title: string;
  let body: string;
  let link: React.ReactNode = null;

  switch (state) {
    case 'expired':
      title = strings.stateExpiredTitle;
      body = strings.stateExpiredBody;
      link = (
        <a
          href={`mailto:hiring@${companyName.toLowerCase().replace(/\s/g, '')}.com`}
          className="iv-state-link"
        >
          {strings.stateExpiredContact}
        </a>
      );
      break;
    case 'invalid':
      title = strings.stateInvalidTitle;
      body = strings.stateInvalidBody;
      break;
    case 'completed':
      title = strings.stateCompletedTitle;
      body = strings.stateCompletedBody(strings.stateCompletedDate);
      break;
    case 'no_questions':
      title = strings.stateNoQuestionsTitle;
      body = strings.stateNoQuestionsBody;
      break;
  }

  return (
    <div className="iv-state-page">
      <span className="iv-status-dot" aria-hidden="true" />
      <h1 className="iv-state-title">{title}</h1>
      <p className="iv-state-body">{body}</p>
      {link}
    </div>
  );
}
