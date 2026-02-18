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
];
