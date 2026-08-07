'use client';

import * as React from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
] as const;

const STORAGE_KEY = 'xinterview-lang';

export function LanguageSelector() {
  const [selected, setSelected] = React.useState<string>('en');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setSelected(stored);
  }, []);

  const handleSelect = (code: string) => {
    setSelected(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore
    }
  };

  const current = LANGUAGES.find((l) => l.code === selected);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Select language"
          className="gap-2 rounded-md border-border bg-surface text-bodyText"
        >
          <Globe size={16} strokeWidth={1.5} />
          {mounted && current ? current.label : 'English'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className="gap-2"
          >
            <span>{lang.label}</span>
            {mounted && selected === lang.code && (
              <Check size={16} strokeWidth={2} className="ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
