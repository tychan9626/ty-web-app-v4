import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [{
    path: '', 
    component: LayoutComponent, // 外殼
    children: [
      {
        path: 'welcome',
        loadComponent: () => import('./pages/welcome/welcome').then(m => m.Welcome)
      },
      {
        path: '',
        redirectTo: 'welcome',
        pathMatch: 'full'
      }
    ]
  }];
