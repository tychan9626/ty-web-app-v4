import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  computed,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

import { HeaderService } from '../../core/services/header.service';
import { FitService } from './fit.service';

type FitListItemVm = {
  tb_tyapp_fit_ssn_id: string;
  session_date: string;
  session_title: string;
  location: string | null;
  remarks: string | null;
  status: number;
  displayTitle: string;
  displaySubtitle: string;
  displayMeta: string;
};

type FitListGroupVm = {
  periodLabel: string;
  items: FitListItemVm[];
};

@Component({
  selector: 'app-fit-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './fit-list.html',
  styleUrl: './fit-list.scss',
})
export class FitList implements OnInit, OnDestroy {
  public fitService = inject(FitService);

  private headerService = inject(HeaderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  listVM = computed<FitListItemVm[]>(() => {
    return this.fitService.sessions().map((session) => {
      const title = session.session_title?.trim() || 'Untitled Session';

      const subtitleParts = [
        session.location?.trim(),
        session.remarks?.trim(),
      ].filter(Boolean);

      const displaySubtitle =
        subtitleParts.length > 0 ? subtitleParts.join(' · ') : 'No extra notes';

      return {
        tb_tyapp_fit_ssn_id: session.tb_tyapp_fit_ssn_id,
        session_date: session.session_date,
        session_title: session.session_title || '',
        location: session.location || null,
        remarks: session.remarks || null,
        status: session.status,
        displayTitle: session.session_date,
        displaySubtitle,
        displayMeta: title,
      };
    });
  });

  groupedListVM = computed<FitListGroupVm[]>(() => {
    const sessions = this.listVM();
    const map = new Map<string, FitListItemVm[]>();

    for (const item of sessions) {
      const periodLabel = this.getWeekLabel(item.session_date);
      if (!map.has(periodLabel)) {
        map.set(periodLabel, []);
      }
      map.get(periodLabel)!.push(item);
    }

    return Array.from(map.entries()).map(([periodLabel, items]) => ({
      periodLabel,
      items,
    }));
  });

  ngOnInit() {
    const isLoading = computed(() => this.fitService.loading());

    this.headerService.setConfig({
      actions: [
        {
          label: 'Refresh',
          icon: 'refresh',
          type: 'secondary',
          disabled: isLoading,
          onClick: () => this.onRefresh(),
        },
        {
          label: 'New Session',
          icon: 'add',
          type: 'primary',
          disabled: isLoading,
          onClick: () =>
            this.router.navigate(['../new'], { relativeTo: this.route }),
        },
      ],
    });

    this.fitService.fetchAllSessions();
  }

  async onRefresh() {
    await this.fitService.fetchAllSessions(true);
  }

  ngOnDestroy() {
    this.headerService.clear();
  }

  private getWeekLabel(dateStr: string): string {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'Unknown Week';

    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const format = (d: Date) =>
      d.toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

    return `${format(monday)} - ${format(sunday)}`;
  }
}