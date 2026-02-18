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
        path: 'user-management/clients', 
        loadComponent: () => import('./pages/user-management/client/client').then(m => m.Client) 
      },
    ]
  },

  { path: '**', redirectTo: '' }
];
