import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { AuthGuard } from './guards/auth.guard';
import { Login } from './pages/login/login';
import { MainContent } from './components/layout/main-content/main-content';

export const routes: Routes = [
  { path: 'login', component: Login }, // login has no layout

  {
    path: '',
    component: MainContent, // layout wrapper
    canActivate: [AuthGuard],
    children: [
      { path: '', component: Dashboard },
      { path: 'profile', component: Dashboard },
      // other protected pages here
    ]
  },

  { path: '**', redirectTo: '' } // fallback
];
