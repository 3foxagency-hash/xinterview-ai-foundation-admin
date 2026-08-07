import * as React from 'react';

export interface AuthFooterLinkProps {
  prompt: string;
  linkText: string;
  href: string;
}

export function AuthFooterLink({ prompt, linkText, href }: AuthFooterLinkProps) {
  return (
    <p className="text-body-sm text-bodyText">
      {prompt}{' '}
      <a
        href={href}
        className="font-semibold text-primary underline-offset-4 transition-colors hover:text-primary-hover hover:underline rounded"
      >
        {linkText}
      </a>
    </p>
  );
}
