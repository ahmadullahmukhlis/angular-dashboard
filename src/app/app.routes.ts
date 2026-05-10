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
        path: 'auth/users',
        loadComponent: () => import('./pages/auth/users/users').then(m => m.AuthUsers)
      },
      {
        path: 'auth/roles',
        loadComponent: () => import('./pages/auth/roles/roles').then(m => m.Roles)
      },
      {
        path: 'auth/permissions',
        loadComponent: () => import('./pages/auth/permissions/permissions').then(m => m.Permissions)
      },
      {
        path: 'settings/languages',
        loadComponent: () => import('./pages/settings/languages/languages').then(m => m.SettingsLanguages)
      },
      {
        path: 'settings/backups',
        loadComponent: () => import('./pages/settings/backups/backups').then(m => m.SettingsBackups)
      },
    ]
  },

  { path: '**', redirectTo: '' }
];
