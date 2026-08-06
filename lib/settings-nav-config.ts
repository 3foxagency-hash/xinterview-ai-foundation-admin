import {
  Briefcase,
  Building2,
  Users,
  Palette,
  CreditCard,
  Video,
  ClipboardCheck,
  FileQuestion,
  Plug,
  User,
  Lock,
  Bell,
  Code,
  Shield,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

export type SettingsScope = 'company' | 'personal';

export type SettingsNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  scope: SettingsScope;
  danger?: boolean;
};

export type SettingsNavGroup = {
  label: string;
  items: SettingsNavItem[];
};

const BASE = '/settings';

export const settingsNavGroups: SettingsNavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'General', href: `${BASE}/general`, icon: Building2, scope: 'company' },
      { label: 'Team members', href: `${BASE}/team`, icon: Users, scope: 'company' },
      { label: 'Billing & plan', href: `${BASE}/billing`, icon: CreditCard, scope: 'company' },
    ],
  },
  {
    label: 'Product',
    items: [
      { label: 'Branding', href: `${BASE}/branding`, icon: Palette, scope: 'company' },
      { label: 'Interview defaults', href: `${BASE}/interview-defaults`, icon: Video, scope: 'company' },
      { label: 'Evaluation criteria', href: `${BASE}/evaluation-criteria`, icon: ClipboardCheck, scope: 'company' },
      { label: 'Question library', href: `${BASE}/question-library`, icon: FileQuestion, scope: 'company' },
      { label: 'Integrations', href: `${BASE}/integrations`, icon: Plug, scope: 'company' },
    ],
  },
  {
    label: 'Personal',
    items: [
      { label: 'Careers page', href: `${BASE}/career`, icon: Briefcase, scope: 'company' },
      { label: 'Profile', href: `${BASE}/profile`, icon: User, scope: 'personal' },
      { label: 'Password & security', href: `${BASE}/security`, icon: Lock, scope: 'personal' },
      { label: 'Notifications', href: `${BASE}/notifications`, icon: Bell, scope: 'personal' },
    ],
  },
  {
    label: 'Advanced',
    items: [
      { label: 'API & webhooks', href: `${BASE}/api`, icon: Code, scope: 'company' },
      { label: 'Data & privacy', href: `${BASE}/data-privacy`, icon: Shield, scope: 'company' },
      { label: 'Danger zone', href: `${BASE}/danger-zone`, icon: AlertTriangle, scope: 'company', danger: true },
    ],
  },
];

export const ALL_SETTINGS_SECTIONS = settingsNavGroups.flatMap((g) => g.items.map((i) => i.href));

export const SETTINGS_SECTION_TITLES: Record<string, string> = Object.fromEntries(
  settingsNavGroups
    .flatMap((g) => g.items)
    .map((i) => [i.href, i.label])
);
