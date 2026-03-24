import { Routes } from '@angular/router';
import { ArticleList } from './article-list';
import { ArticleEdit } from './article-edit';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const ARTICLE_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: ArticleList },
      {
        path: 'new',
        component: ArticleEdit,
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'edit/:id',
        component: ArticleEdit,
        canDeactivate: [unsavedChangesGuard],
      },
    ],
  },
];
