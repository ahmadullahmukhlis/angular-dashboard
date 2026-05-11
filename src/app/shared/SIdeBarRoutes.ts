import { SidebarItem } from '../models/sidebar-item.model';

export const SIDEBAR_ROUTES: SidebarItem[] = [
  {
    id: 1,
    label: 'Dashboard',
    icon: 'fa-home',
    route: '/',
    isActive: true,
    isExpanded: false,
  },
  {
    id: 4,
    label: 'User Management',
    icon: 'fa-user-shield',
    route: '/auth',
    isActive: false,
    isExpanded: false,
    children: [
      { id: 42, label: 'Users', icon: 'fa-users', route: '/auth/users', isActive: false },
      { id: 44, label: 'Roles', icon: 'fa-user-tag', route: '/auth/roles', isActive: false },
      { id: 46, label: 'Permissions', icon: 'fa-shield-alt', route: '/auth/permissions', isActive: false },
    ],
  },
  {
    id: 5,
    label: 'Settings',
    icon: 'fa-cog',
    route: '/settings',
    isActive: false,
    isExpanded: false,
    children: [
      { id: 50, label: 'Languages', icon: 'fa-language', route: '/settings/languages', isActive: false },
      { id: 51, label: 'Backups', icon: 'fa-database', route: '/settings/backups', isActive: false },
      { id: 52, label: 'Identity', icon: 'fa-fingerprint', route: '/settings/identity', isActive: false },
    ],
  },
];
