import { SidebarItem } from '../models/sidebar-item.model';

export const SIDEBAR_ROUTES: SidebarItem[] = [
  {
    id: 1,
    label: 'Dashboard',
    icon: 'fa-home',
    route: '/dashboard',
    isActive: true,
    isExpanded: true,
    children: [
      {
        id: 11,
        label: 'Overview',
        icon: 'fa-chart-pie',
        route: '/dashboard/overview',
        isActive: true,
        badge: { text: '5', color: 'bg-primary-500' },
      },
      {
        id: 12,
        label: 'Analytics',
        icon: 'fa-chart-line',
        route: '/dashboard/analytics',
        isActive: false,
      },
      {
        id: 13,
        label: 'Campaigns',
        icon: 'fa-bullhorn',
        route: '/dashboard/campaigns',
        isActive: false,
      },
    ],
  },
  {
    id: 2,
    label: 'Apps',
    icon: 'fa-th-large',
    route: '/apps',
    isActive: false,
    isExpanded: false,
    children: [
      { id: 21, label: 'Chat', icon: 'fa-comments', route: '/apps/chat', isActive: false },
      { id: 22, label: 'Email', icon: 'fa-envelope', route: '/apps/email', isActive: false },
      {
        id: 23,
        label: 'Calendar',
        icon: 'fa-calendar-alt',
        route: '/apps/calendar',
        isActive: false,
      },
    ],
  },
  {
    id: 3,
    label: 'Pages',
    icon: 'fa-file-alt',
    route: '/pages',
    isActive: false,
    isExpanded: false,
    children: [
      { id: 31, label: 'Users', icon: 'fa-users', route: '/pages/users', isActive: false },
      {
        id: 32,
        label: 'Profile',
        icon: 'fa-user-circle',
        route: '/pages/profile',
        isActive: false,
      },
      { id: 33, label: 'Settings', icon: 'fa-cog', route: '/pages/settings', isActive: false },
    ],
  },
];
