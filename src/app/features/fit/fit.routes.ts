import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const FIT_ROUTES: Routes = [
  {
    path: 'list',
    loadComponent: () => import('./fit-list').then((m) => m.FitList),
  },
  {
    path: 'new',
    loadComponent: () => import('./fit-edit').then((m) => m.FitEdit),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./fit-edit').then((m) => m.FitEdit),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
];