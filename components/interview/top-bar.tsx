'use client';

import * as React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useInterviewTheme } from '@/components/interview/theme-provider';
import { strings } from '@/lib/interview/strings';
import type { InterviewConfig } from '@/config/interview.mock';

interface TopBarProps {
  config: InterviewConfig;
}

export function TopBar({ config }: TopBarProps) {
  const { resolved, toggle, canToggle } = useInterviewTheme();
  const { company, locale } = config;
  const [langOpen, setLangOpen] = React.useState(false);
  const [lang, setLang] = React.useState(locale.current);

  const logoSrc = resolved === 'dark' ? company.logoDarkUrl : company.logoUrl;
  const showLogo = logoSrc !== null;
  const showWordmark = !showLogo;

  return (
    <header className="iv-topbar">
      {/* Logo / wordmark */}
      <div className="iv-topbar-logo">
        {showLogo && (
          <img src={logoSrc!} alt={`${company.name} logo`} />
        )}
        {showWordmark && <span>{company.name}</span>}
      </div>

      {/* Right side controls */}
      <div className="iv-topbar-right">
        <select
          className="iv-lang-selector"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          aria-label={strings.languageLabel}
          onFocus={() => setLangOpen(true)}
          onBlur={() => setLangOpen(false)}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            paddingRight: '16px',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath fill='none' stroke='%23999' stroke-width='1' d='M1 1l3 3 3-3'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right center',
          }}
        >
          {locale.available.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <a href="#" className="iv-topbar-link">
          {strings.help}
        </a>

        {canToggle && (
          <button
            type="button"
            className="iv-theme-toggle"
            onClick={toggle}
            aria-label={
              resolved === 'dark'
                ? strings.themeToggleLight
                : strings.themeToggleDark
            }
          >
            {resolved === 'dark' ? (
              <Sun size={16} strokeWidth={1.5} />
            ) : (
              <Moon size={16} strokeWidth={1.5} />
            )}
          </button>
        )}

        <span className="iv-powered-by">{strings.poweredBy}</span>
      </div>
    </header>
  );
}
