import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [{
    path: '', 
    component: LayoutComponent, // 外殼
    children: [
      // 未來的頁面都會放在這裡，例如：
      // { path: 'dashboard', component: DashboardComponent },
      // { path: 'users/list', component: UserListComponent },
    ]
  }];
