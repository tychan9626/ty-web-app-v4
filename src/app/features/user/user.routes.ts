import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';
import { UserList } from './pages/user-list/user-list';

export const USER_ROUTES: Routes = [
  { 
    path: 'list', 
    component: UserList, 
    canActivate: [adminGuard] 
  },
  { 
    path: 'edit/:id', 
    loadComponent: () => import('./pages/user-edit/user-edit').then(m => m.UserEdit),
    canActivate: [adminGuard] 
  }
];