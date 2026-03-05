import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login)
  },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'welcome',
        pathMatch: 'full'
      },
      {
        path: 'welcome',
        loadComponent: () => import('./pages/welcome/welcome').then((m) => m.Welcome)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];