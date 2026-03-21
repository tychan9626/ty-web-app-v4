import { Routes } from '@angular/router';
import { AppFunctionList } from './pages/app-function-list/app-function-list';
import { AppFunctionEdit } from './pages/app-function-edit/app-function-edit';

export const APP_FUNCTION_ROUTES: Routes = [
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
        component: AppFunctionList,
      },
      {
        path: 'new',
        component: AppFunctionEdit,
      },
      {
        path: 'edit/:id',
        component: AppFunctionEdit,
      },
    ],
  },
];
