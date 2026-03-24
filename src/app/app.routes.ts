import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'welcome',
        pathMatch: 'full',
      },
      {
        path: 'welcome',
        loadComponent: () =>
          import('./pages/welcome/welcome').then((m) => m.Welcome),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/user/user.routes').then((m) => m.USER_ROUTES),
      },
      {
        path: 'development',
        children: [
          {
            path: 'category',
            loadChildren: () =>
              import('./features/development/app-category/app-category.routes').then(
                (m) => m.APP_CATEGORY_ROUTES,
              ),
          },
          {
            path: 'function',
            loadChildren: () =>
              import('./features/development/app-function/app-function.routes').then(
                (m) => m.APP_FUNCTION_ROUTES,
              ),
          },
          {
            path: 'log',
            loadChildren: () =>
              import('./features/development/app-log/app-log.routes').then(
                (m) => m.APP_LOG_ROUTES,
              ),
          }
        ],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
