import {
  Home,
  Plus,
  Briefcase,
  Users,
  FileText,
  BookOpen,
  Calendar,
  HelpCircle,
  Bell,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  count?: number;
  unread?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const primaryNavGroups: NavGroup[] = [
  {
    label: 'Hiring',
    items: [
      { label: 'Overview', href: '/dashboard', icon: Home },
      { label: 'Create New Job', href: '/create-job', icon: Plus },
      { label: 'Jobs', href: '/jobs', icon: Briefcase },
      { label: 'Candidates', href: '/candidates', icon: Users, count: 12 },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Reports', href: '/reports', icon: FileText },
    ],
  },
];

export const bottomNavItems: NavItem[] = [
  { label: 'Documentation', href: '/documentation', icon: BookOpen },
  { label: "What's new", href: '/whats-new', icon: Calendar, unread: true },
  { label: 'Help & support', href: '/support', icon: HelpCircle },
  { label: 'Notifications', href: '/notifications', icon: Bell, count: 3 },
];
