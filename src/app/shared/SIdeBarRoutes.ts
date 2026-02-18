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
    id: 2,
    label: 'User Mangement',
    icon: 'fa-th-large',
    route: '/apps',
    isActive: false,
    isExpanded: false,
    children: [
      { id: 21, label: 'Clients', icon: 'fa-comments', route: '/user-management/clients', isActive: false },
      { id: 22, label: 'Users', icon: 'fa-envelope', route: '/user-management/clients', isActive: false },
      {
        id: 23,
        label: 'Roles',
        icon: 'fa-calendar-alt',
        route: '/user-management/roles',
        isActive: false,
      },
    ],
  },

];
