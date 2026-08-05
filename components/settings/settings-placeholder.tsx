import { SettingsPage } from '@/components/settings/settings-page';
import type { SettingsScope } from '@/lib/settings-nav-config';

interface SettingsPlaceholderProps {
  title: string;
  scope: SettingsScope;
}

export function SettingsPlaceholder({ title, scope }: SettingsPlaceholderProps) {
  return (
    <SettingsPage title={title} scope={scope}>
      <p className="text-body text-muted">Coming soon</p>
    </SettingsPage>
  );
}
