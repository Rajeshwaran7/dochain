import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  Clock,
  CreditCard,
  MessageSquare,
  Settings,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';

export const PORTAL_NAV: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', Icon: TrendingUp },
  { href: '/appointments', label: 'Appointments', Icon: Calendar },
  { href: '/availability', label: 'Availability', Icon: Clock },
  { href: '/patients', label: 'Patients', Icon: Users },
  { href: '/messages', label: 'Messages', Icon: MessageSquare },
  { href: '/reviews', label: 'Reviews', Icon: Star },
  { href: '/subscription', label: 'Subscription', Icon: CreditCard },
  { href: '/profile', label: 'Profile', Icon: Settings },
];

const PORTAL_TITLE: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/appointments': 'Appointments',
  '/availability': 'Availability',
  '/patients': 'Patients',
  '/messages': 'Messages',
  '/reviews': 'Reviews',
  '/subscription': 'Subscription',
  '/profile': 'Profile',
};

/**
 * Resolves the header title for the current app path.
 */
export function portalTitleForPath(appPath: string): string {
  if (appPath.startsWith('/messages')) return 'Messages';
  if (appPath.startsWith('/patients/') && appPath !== '/patients') return 'Patient care';
  return PORTAL_TITLE[appPath] ?? 'Dochain';
}
