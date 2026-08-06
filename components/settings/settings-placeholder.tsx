import { SettingsPage } from '@/components/settings/settings-page';
import type { SettingsScope } from '@/lib/settings-nav-config';

interface SettingsPlaceholderProps {
  title: string;
  scope: SettingsScope;
  /** Explains what the page is for — shown even before the section is built. */
  description?: string;
}

export function SettingsPlaceholder({ title, scope, description }: SettingsPlaceholderProps) {
  return (
    <SettingsPage title={title} scope={scope} description={description}>
      <div className="rounded-lg border border-border bg-surface px-4 py-6 text-center">
        <p className="text-body text-muted">This section is coming soon.</p>
      </div>
    </SettingsPage>
  );
}
