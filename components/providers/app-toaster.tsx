'use client';

import { Toaster as SonnerToaster } from 'sonner';
import type { ToasterProps } from 'sonner';

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors={false}
      closeButton
      duration={4500}
      toastOptions={{
        classNames: {
          toast:
            'rounded-lg border border-border bg-surface text-body text-bodyText shadow-md',
          title: 'text-body text-bodyText font-semibold',
          description: 'text-bodyText text-body-sm',
          success:
            'border-transparent bg-success-toast-bg text-success [&_[data-icon]]:text-success',
          error:
            'border-transparent bg-error-banner-bg text-error [&_[data-icon]]:text-error',
          warning:
            'border-transparent bg-surface text-warning [&_[data-icon]]:text-warning',
          info: 'border-transparent bg-surface text-info [&_[data-icon]]:text-info',
          actionButton:
            'rounded-md bg-primary text-primary-foreground text-button',
          cancelButton:
            'rounded-md bg-surface text-bodyText text-button border border-border',
        },
      }}
      {...props}
    />
  );
}
