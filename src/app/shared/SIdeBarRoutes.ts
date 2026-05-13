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
    permissions: ['users-access', 'roles-access', 'permission-groups-access'],
    children: [
      { id: 42, label: 'Users', icon: 'fa-users', route: '/auth/users', isActive: false, permissions: ['users-access'] },
      { id: 44, label: 'Roles', icon: 'fa-user-tag', route: '/auth/roles', isActive: false, permissions: ['roles-access'] },
      { id: 46, label: 'Permissions', icon: 'fa-shield-alt', route: '/auth/permissions', isActive: false, permissions: ['permission-groups-access'] },
    ],
  },
  {
    id: 5,
    label: 'Settings',
    icon: 'fa-cog',
    route: '/settings',
    isActive: false,
    isExpanded: false,
    permissions: ['languages-accss', 'backup-access', 'identity-realms-access', 'login-log-access', 'activity-log-access', 'log-activity-access'],
    children: [
      { id: 50, label: 'Languages', icon: 'fa-language', route: '/settings/languages', isActive: false, permissions: ['languages-accss'] },
      { id: 51, label: 'Backups', icon: 'fa-database', route: '/settings/backups', isActive: false, permissions: ['backup-access'] },
      { id: 52, label: 'Identity', icon: 'fa-fingerprint', route: '/settings/identity', isActive: false, permissions: ['identity-realms-access', 'identity-clients-access', 'identity-service-accounts-access'] },
      { id: 53, label: 'Login Logs', icon: 'fa-right-to-bracket', route: '/settings/login-logs', isActive: false, permissions: ['login-log-access'] },
      { id: 54, label: 'Activity Logs', icon: 'fa-clock-rotate-left', route: '/settings/activity-logs', isActive: false, permissions: ['activity-log-access', 'log-activity-access'] },
    ],
  },
];
