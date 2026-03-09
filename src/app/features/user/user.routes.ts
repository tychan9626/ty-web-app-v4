import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';
import { UserList } from './pages/user-list/user-list';
import { UserEdit } from './pages/user-edit/user-edit';

export const USER_ROUTES: Routes = [
  { 
    path: 'list', 
    component: UserList, 
    canActivate: [adminGuard] 
  },
  { 
    path: 'edit/:id', 
    component: UserEdit,
    canActivate: [adminGuard] 
  }
];