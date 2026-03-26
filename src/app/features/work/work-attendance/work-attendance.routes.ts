import { Routes } from '@angular/router';
import { WorkAttendanceList } from './work-attendance-list';
import { WorkAttendanceEdit } from './work-attendance-edit';
import { unsavedChangesGuard } from '../../../core/guards/unsaved-changes.guard';

export const WORK_ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: WorkAttendanceList },
      {
        path: 'new',
        component: WorkAttendanceEdit,
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'edit/:id',
        component: WorkAttendanceEdit,
        canDeactivate: [unsavedChangesGuard],
      },
    ],
  },
];
