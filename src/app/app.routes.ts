import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
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
        path: 'auth/clients',
        loadComponent: () => import('./pages/auth/clients/clients').then(m => m.AuthClients)
      },
      {
        path: 'auth/context',
        loadComponent: () => import('./pages/auth/context/context').then(m => m.AuthContext)
      },
      {
        path: 'auth/users',
        loadComponent: () => import('./pages/auth/users/users').then(m => m.AuthUsers)
      },
      {
        path: 'auth/role-groups',
        loadComponent: () => import('./pages/auth/role-groups/role-groups').then(m => m.RoleGroups)
      },
      {
        path: 'auth/roles',
        loadComponent: () => import('./pages/auth/roles/roles').then(m => m.Roles)
      },
      {
        path: 'auth/permission-groups',
        loadComponent: () => import('./pages/auth/permission-groups/permission-groups').then(m => m.PermissionGroups)
      },
      {
        path: 'auth/permissions',
        loadComponent: () => import('./pages/auth/permissions/permissions').then(m => m.Permissions)
      },
      {
        path: 'auth/oauth',
        loadComponent: () => import('./pages/auth/oauth/oauth').then(m => m.OAuthTools)
      },
      {
        path: 'auth/mfa',
        loadComponent: () => import('./pages/auth/mfa/mfa').then(m => m.MfaPage)
      },
    ]
  },

  { path: '**', redirectTo: '' }
];
