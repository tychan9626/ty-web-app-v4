import { Routes } from '@angular/router';
import { EmploymentList } from './employment-list';
import { EmploymentEdit } from './employment-edit';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const EMPLOYMENT_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: EmploymentList },
      {
        path: 'new',
        component: EmploymentEdit,
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'edit/:id',
        component: EmploymentEdit,
        canDeactivate: [unsavedChangesGuard],
      },
    ],
  },
];
