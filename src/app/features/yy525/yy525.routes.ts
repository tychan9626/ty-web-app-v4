import { Routes } from '@angular/router';
import { YyemsAnalytics } from './yyems-analytics/yyems-analytics';

export const YY525_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'analytics', pathMatch: 'full' },
      { path: 'analytics', component: YyemsAnalytics },
    ],
  },
];