'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Check, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';
  const isSystem = theme === 'system';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Select theme"
          className="rounded-md border-border bg-surface"
        >
          {mounted ? (
            isDark ? <Moon size={20} strokeWidth={1.5} /> : <Sun size={20} strokeWidth={1.5} />
          ) : (
            <Sun size={20} strokeWidth={1.5} className="opacity-0" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="gap-2"
        >
          <Sun size={16} strokeWidth={1.5} />
          <span>Light</span>
          {mounted && !isSystem && !isDark && <Check size={16} strokeWidth={2} className="ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="gap-2"
        >
          <Moon size={16} strokeWidth={1.5} />
          <span>Dark</span>
          {mounted && !isSystem && isDark && <Check size={16} strokeWidth={2} className="ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="gap-2"
        >
          <Monitor size={16} strokeWidth={1.5} />
          <span>System</span>
          {mounted && isSystem && <Check size={16} strokeWidth={2} className="ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
