'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

export interface NavTooltipProps {
  label: string;
  side?: 'right' | 'left';
  children: React.ReactElement<{
    onFocus?: React.FocusEventHandler;
    onBlur?: React.FocusEventHandler;
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
  }>;
}

export function NavTooltip({ label, side = 'right', children }: NavTooltipProps) {
  const [visible, setVisible] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = React.useRef<HTMLSpanElement>(null);

  const show = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = wrapperRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const top = rect.top + rect.height / 2;
        const left = side === 'right' ? rect.right + 8 : rect.left - 8;
        setCoords({ top, left });
      }
      setVisible(true);
    }, 400);
  }, [side]);

  const hide = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }, []);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <>
      <span ref={wrapperRef} className="relative inline-flex">
        {React.cloneElement(children, {
          onFocus: (e: React.FocusEvent) => { show(); children.props.onFocus?.(e); },
          onBlur: (e: React.FocusEvent) => { hide(); children.props.onBlur?.(e); },
          onMouseEnter: (e: React.MouseEvent) => { show(); children.props.onMouseEnter?.(e); },
          onMouseLeave: (e: React.MouseEvent) => { hide(); children.props.onMouseLeave?.(e); },
        })}
      </span>
      {visible && coords && typeof document !== 'undefined' && createPortal(
        <span
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform: side === 'right' ? 'translateY(-50%)' : 'translate(-100%, -50%)',
          }}
          className="pointer-events-none z-[9999] whitespace-nowrap rounded-md bg-surface px-2.5 py-1.5 text-caption font-medium text-heading shadow-lg border border-border"
        >
          {label}
        </span>,
        document.body
      )}
    </>
  );
}
