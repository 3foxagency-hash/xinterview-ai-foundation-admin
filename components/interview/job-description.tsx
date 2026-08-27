'use client';

import * as React from 'react';
import { strings } from '@/lib/interview/strings';

interface JobDescriptionProps {
  descriptionHtml: string;
  /** Mode C (Section 3): the JD is the hero, so the card expands to
   *  the full available column height and scrolls internally instead
   *  of capping at ~420px with an expander. */
  fillColumn?: boolean;
}

export function JobDescription({
  descriptionHtml,
  fillColumn = false,
}: JobDescriptionProps) {
  const [expanded, setExpanded] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [needsTruncation, setNeedsTruncation] = React.useState(false);

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // In fill mode the card scrolls internally, so there is nothing to
    // truncate and no expander to offer.
    if (fillColumn) {
      setNeedsTruncation(false);
      return;
    }
    // Check if content exceeds the max-height
    setNeedsTruncation(el.scrollHeight > 480);
  }, [descriptionHtml, fillColumn]);

  return (
    <div className={`iv-desc-panel ${fillColumn ? 'iv-desc-fill' : ''}`}>
      <div className="iv-desc-heading-row">
        <span className="iv-micro-label iv-desc-label">
          {strings.jobDescriptionLabel}
        </span>
        <span className="iv-desc-underline" aria-hidden="true" />
      </div>

      <div
        className={`iv-desc-clip ${expanded ? 'expanded' : ''} ${
          fillColumn ? 'iv-desc-clip-fill' : ''
        }`}
      >
        <div
          ref={contentRef}
          className="iv-desc-content"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />

        {!expanded && needsTruncation && (
          <div className="iv-desc-fade" aria-hidden="true" />
        )}
      </div>

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
