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
      { label: 'Create New Job', href: '/dashboard/create-job', icon: Plus },
      { label: 'Jobs', href: '/dashboard/jobs', icon: Briefcase },
      { label: 'Candidates', href: '/dashboard/candidates', icon: Users, count: 12 },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Reports', href: '/dashboard/reports', icon: FileText },
    ],
  },
];

export const bottomNavItems: NavItem[] = [
  { label: 'Documentation', href: '/dashboard/documentation', icon: BookOpen },
  { label: "What's new", href: '/dashboard/whats-new', icon: Calendar, unread: true },
  { label: 'Help & support', href: '/dashboard/support', icon: HelpCircle },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, count: 3 },
];
