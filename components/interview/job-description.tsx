'use client';

import * as React from 'react';
import { strings } from '@/lib/interview/strings';

interface JobDescriptionProps {
  descriptionHtml: string;
}

export function JobDescription({ descriptionHtml }: JobDescriptionProps) {
  const [expanded, setExpanded] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [needsTruncation, setNeedsTruncation] = React.useState(false);

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // Check if content exceeds the max-height
    setNeedsTruncation(el.scrollHeight > 480);
  }, [descriptionHtml]);

  return (
    <div className={`iv-plane iv-desc-panel ${expanded ? 'expanded' : ''}`}>
      <div className="iv-desc-heading-row">
        <span className="iv-micro-label iv-desc-label">
          {strings.jobDescriptionLabel}
        </span>
        <span className="iv-desc-underline" aria-hidden="true" />
      </div>

      <div
        ref={contentRef}
        className="iv-desc-content"
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      />

      {!expanded && needsTruncation && (
        <div className="iv-desc-fade" aria-hidden="true" />
      )}

      {needsTruncation && (
        <button
          type="button"
          className="iv-desc-show-more"
          onClick={() => setExpanded((p) => !p)}
        >
          {expanded ? strings.showLess : strings.showMore}
        </button>
      )}
    </div>
  );
}
