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
          },
        ],
      },
      {
        path: 'article',
        loadChildren: () =>
          import('./features/article/article.routes').then(
            (m) => m.ARTICLE_ROUTES,
          ),
      },
      {
        path: 'work',
        children: [
          {
            path: 'attendance',
            loadChildren: () =>
              import('./features/work/work-attendance/work-attendance.routes').then(
                (m) => m.WORK_ATTENDANCE_ROUTES,
              ),
          },
          {
            path: 'schedule',
            loadChildren: () =>
              import('./features/work/work-schedule/work-schedule.routes').then(
                (m) => m.WORK_SCHEDULE_ROUTES,
              ),
          },
          {
            path: 'employment',
            loadChildren: () =>
              import('./features/work/work-employment/work-employment.routes').then(
                (m) => m.WORK_EMPLOYMENT_ROUTES,
              ),
          },
        ],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
