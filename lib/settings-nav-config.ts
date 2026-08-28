import {
  Briefcase,
  Building2,
  Users,
  CreditCard,
  FileQuestion,
  Plug,
  User,
  Lock,
  Bell,
  AlertTriangle,
  Palette,
  FileText,
  ListChecks,
  CheckCircle,
  Share2,
  Shield,
  Mail,
  Globe,
  Server,
  Tags,
  GitBranch,
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
const WS = '/workspace-settings';

/**
 * Organisation settings — the company account. Billing, the team roster, API
 * keys and your own profile live here, because they are the same no matter
 * which workspace you are working in.
 */
export const settingsNavGroups: SettingsNavGroup[] = [
  {
    label: 'Organisation',
    items: [
      { label: 'General', href: `${BASE}/general`, icon: Building2, scope: 'company' },
      { label: 'Team members', href: `${BASE}/team`, icon: Users, scope: 'company' },
      { label: 'Billing & plan', href: `${BASE}/billing`, icon: CreditCard, scope: 'company' },
    ],
  },
  {
    label: 'Product',
    items: [
      { label: 'Question library', href: `${BASE}/question-library`, icon: FileQuestion, scope: 'company' },
    ],
  },
  {
    label: 'Personal',
    items: [
      { label: 'Profile', href: `${BASE}/profile`, icon: User, scope: 'personal' },
      { label: 'Password & security', href: `${BASE}/security`, icon: Lock, scope: 'personal' },
    ],
  },
  {
    label: 'Advanced',
    items: [
      { label: 'Integrations', href: `${BASE}/integrations`, icon: Plug, scope: 'company' },
      { label: 'Danger zone', href: `${BASE}/danger-zone`, icon: AlertTriangle, scope: 'company', danger: true },
    ],
  },
];

/**
 * Workspace settings — everything candidate-facing. Mirrors the per-job
 * customisation wizard, so what you set here as a workspace default reads the
 * same as overriding it on an individual job.
 */
export const workspaceNavGroups: SettingsNavGroup[] = [
  {
    label: 'Candidate experience',
    items: [
      { label: 'Branding', href: `${WS}/branding`, icon: Palette, scope: 'company' },
      { label: 'Welcome page', href: `${WS}/welcome`, icon: FileText, scope: 'company' },
      { label: 'Form settings', href: `${WS}/form`, icon: ListChecks, scope: 'company' },
      { label: 'Thank you page', href: `${WS}/thank-you`, icon: CheckCircle, scope: 'company' },
      { label: 'Social preview', href: `${WS}/social`, icon: Share2, scope: 'company' },
    ],
  },
  {
    label: 'Interview',
    items: [
      { label: 'Interview experience', href: `${WS}/experience`, icon: Shield, scope: 'company' },
      { label: 'Notifications', href: `${WS}/interview-emails`, icon: Mail, scope: 'company' },
    ],
  },
  {
    label: 'Evaluation',
    items: [
      { label: 'Scoring labels', href: `${WS}/scoring`, icon: Tags, scope: 'company' },
      { label: 'Stages', href: `${WS}/stages`, icon: GitBranch, scope: 'company' },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { label: 'Domain settings', href: `${WS}/domain`, icon: Globe, scope: 'company' },
      { label: 'SMTP settings', href: `${WS}/smtp`, icon: Server, scope: 'company' },
    ],
  },
  // These two are sections in their own right, but each holds a single page —
  // repeating the name as a group header above an identically-named item reads
  // as a duplicate, so the item carries the label and the header is blank.
  {
    label: '',
    items: [
      { label: 'Careers page', href: `${WS}/career`, icon: Briefcase, scope: 'company' },
      { label: 'Templates', href: `${WS}/notifications`, icon: Bell, scope: 'company' },
    ],
  },
];
