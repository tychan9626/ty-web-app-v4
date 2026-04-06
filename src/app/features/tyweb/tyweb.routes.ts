import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';
import { TyWebContentManager } from './content-manager';

export const TYWEB_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'content', pathMatch: 'full' },

      {
        path: 'content',
        component: TyWebContentManager,
        canDeactivate: [unsavedChangesGuard],
      },
    ],
  },
];
