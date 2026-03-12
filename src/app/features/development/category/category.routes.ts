import { Routes } from '@angular/router';
import { adminGuard } from '../../../core/guards/admin.guard';
import { CategoryList } from './pages/category-list/category-list';
import { CategoryEdit } from './pages/category-edit/category-edit';

export const CATEGORY_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
      {
        path: 'list',
        component: CategoryList,
      },
      {
        path: 'new',
        component: CategoryEdit,
      },
      {
        path: 'edit/:id',
        component: CategoryEdit,
      },
    ],
  },
];
