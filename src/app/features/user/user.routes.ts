import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';
import { UserList } from './pages/user-list/user-list';
import { UserEdit } from './pages/user-edit/user-edit';

export const USER_ROUTES: Routes = [
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
        component: UserList,
      },
      {
        path: 'edit/:id',
        component: UserEdit,
      },
    ],
  },
];
