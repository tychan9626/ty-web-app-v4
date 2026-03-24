import { Routes } from '@angular/router';
import { AppLogList } from './app-log-list';
import { AppLogEdit } from './app-log-edit';

export const APP_LOG_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        component: AppLogList,
      },
      {
        path: 'new',
        component: AppLogEdit,
      },
      {
        path: 'edit/:id',
        component: AppLogEdit,
      },
    ],
  },
];
