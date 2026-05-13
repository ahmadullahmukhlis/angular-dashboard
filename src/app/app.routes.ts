import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { Login } from './pages/login/login';
import { MainContent } from './components/layout/main-content/main-content';

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: '',
    component: MainContent, 
    canActivate: [AuthGuard],
    children: [
      { 
        path: '', 
        // FIX: Use loadComponent to lazy load the page
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) 
      },
      { 
        path: 'profile', 
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) 
      },
      {
        path: 'auth/users',
        canActivate: [PermissionGuard],
        data: { permissions: ['users-access'] },
        loadComponent: () => import('./pages/auth/users/users').then(m => m.AuthUsers)
      },
      {
        path: 'auth/roles',
        canActivate: [PermissionGuard],
        data: { permissions: ['roles-access'] },
        loadComponent: () => import('./pages/auth/roles/roles').then(m => m.Roles)
      },
      {
        path: 'auth/permissions',
        canActivate: [PermissionGuard],
        data: { permissions: ['permission-groups-access'] },
        loadComponent: () => import('./pages/auth/permissions/permissions').then(m => m.Permissions)
      },
      {
        path: 'settings/languages',
        canActivate: [PermissionGuard],
        data: { permissions: ['languages-accss'] },
        loadComponent: () => import('./pages/settings/languages/languages').then(m => m.SettingsLanguages)
      },
      {
        path: 'settings/backups',
        canActivate: [PermissionGuard],
        data: { permissions: ['backup-access'] },
        loadComponent: () => import('./pages/settings/backups/backups').then(m => m.SettingsBackups)
      },
      {
        path: 'settings/identity',
        canActivate: [PermissionGuard],
        data: { permissions: ['identity-realms-access', 'identity-clients-access', 'identity-service-accounts-access'] },
        loadComponent: () => import('./pages/settings/identity/identity').then(m => m.SettingsIdentity)
      },
      {
        path: 'settings/login-logs',
        canActivate: [PermissionGuard],
        data: { permissions: ['login-log-access'] },
        loadComponent: () => import('./pages/settings/login-logs/login-logs').then(m => m.SettingsLoginLogs)
      },
      {
        path: 'settings/activity-logs',
        canActivate: [PermissionGuard],
        data: { permissions: ['activity-log-access', 'log-activity-access'] },
        loadComponent: () => import('./pages/settings/activity-logs/activity-logs').then(m => m.SettingsActivityLogs)
      },
    ]
  },

  { path: '**', redirectTo: '' }
];
