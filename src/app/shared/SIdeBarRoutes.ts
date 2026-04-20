import { SidebarItem } from '../models/sidebar-item.model';

export const SIDEBAR_ROUTES: SidebarItem[] = [
  {
    id: 1,
    label: 'Dashboard',
    icon: 'fa-solid fa-gauge', // better dashboard icon
    route: '/',
    isActive: true,
    isExpanded: false,
  },
  {
    id: 2,
    label: 'User Management',
    icon: 'fa-solid fa-users', // group icon
    route: '/apps',
    isActive: false,
    isExpanded: false,
    children: [
      {
        id: 21,
        label: 'Clients',
        icon: 'fa-solid fa-user-tie', // business client
        route: '/user-management/clients',
        isActive: false
      },
      {
        id: 22,
        label: 'Users',
        icon: 'fa-solid fa-user', // simple user
        route: '/user-management/users',
        isActive: false
      },
      {
        id: 23,
        label: 'Roles',
        icon: 'fa-solid fa-user-shield', // roles/permissions
        route: '/user-management/roles',
        isActive: false,
      },
    ],
  },
  {
    id: 4,
    label: 'Auth',
    icon: 'fa-user-shield',
    route: '/auth',
    isActive: false,
    isExpanded: false,
    children: [
      { id: 40, label: 'Client Context', icon: 'fa-bullseye', route: '/auth/context', isActive: false },
      { id: 41, label: 'Clients', icon: 'fa-key', route: '/auth/clients', isActive: false },
      { id: 42, label: 'Users', icon: 'fa-users', route: '/auth/users', isActive: false },
      { id: 43, label: 'Role Groups', icon: 'fa-layer-group', route: '/auth/role-groups', isActive: false },
      { id: 44, label: 'Roles', icon: 'fa-user-tag', route: '/auth/roles', isActive: false },
      {
        id: 45,
        label: 'Permission Groups',
        icon: 'fa-object-group',
        route: '/auth/permission-groups',
        isActive: false,
      },
      { id: 46, label: 'Permissions', icon: 'fa-shield-alt', route: '/auth/permissions', isActive: false },
      { id: 47, label: 'OAuth Tools', icon: 'fa-plug', route: '/auth/oauth', isActive: false },
      { id: 48, label: 'MFA & Email', icon: 'fa-lock', route: '/auth/mfa', isActive: false },
    ],
  },
];
