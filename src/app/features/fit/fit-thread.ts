import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

import { HeaderService } from '../../core/services/header.service';
import { FitService } from './fit.service';
import {
  FitEntrySet,
  FitSessionDetail,
  FitSideCode,
} from './fit.model';

type FitThreadItemVm = {
  id: string;
  sessionDate: string;
  title: string;
  text: string;
  status: number;
};

@Component({
  selector: 'app-fit-thread',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './fit-thread.html',
  styleUrl: './fit-thread.scss',
})
export class FitThread implements OnInit, OnDestroy {
  public fitService = inject(FitService);

  private headerService = inject(HeaderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  threadItems = signal<FitThreadItemVm[]>([]);

  ngOnInit() {
    this.headerService.setConfig({
      actions: [
        {
          label: 'Refresh',
          icon: 'refresh',
          type: 'secondary',
          onClick: () => this.loadThread(true),
        },
        {
          label: 'New Session',
          icon: 'add',
          type: 'primary',
          onClick: () =>
            this.router.navigate(['../new'], { relativeTo: this.route }),
        },
      ],
    });

    this.loadThread();
  }

  ngOnDestroy() {
    this.headerService.clear();
  }

  async loadThread(force = false) {
    this.loading.set(true);

    try {
      await this.fitService.fetchAllSessions(force);
      const sessions = this.fitService.sessions();

      const details = await Promise.all(
        sessions.map((session) =>
          this.fitService.fetchSessionDetail(session.tb_tyapp_fit_ssn_id),
        ),
      );

      const items = details
        .filter((detail): detail is FitSessionDetail => !!detail)
        .map((detail) => ({
          id: detail.session.tb_tyapp_fit_ssn_id,
          sessionDate: detail.session.session_date,
          title: detail.session.session_title?.trim() || 'Untitled Session',
          status: detail.session.status,
          text: this.buildThreadText(detail),
        }));

      this.threadItems.set(items);
    } finally {
      this.loading.set(false);
    }
  }

  onEdit(id: string) {
    this.router.navigate(['../edit', id], {
      relativeTo: this.route,
      queryParams: { returnUrl: '/fit/thread' },
    });
  }

  private buildThreadText(detail: FitSessionDetail): string {
    const lines: string[] = [];
    const session = detail.session;

    lines.push(session.session_date);

    if (session.session_title?.trim()) {
      lines.push(session.session_title.trim());
    }

    if (session.location?.trim()) {
      lines.push(`地點：${session.location.trim()}`);
    }

    if (session.remarks?.trim()) {
      lines.push(`備註：${session.remarks.trim()}`);
    }

    if (detail.entries.length > 0) {
      lines.push('');
    }

    detail.entries.forEach((entry, entryIndex) => {
      lines.push(
        `${entryIndex + 1}. ${entry.exercise_name} (${entry.entry_type})`,
      );

      if (entry.remarks?.trim()) {
        lines.push(`   項目備註：${entry.remarks.trim()}`);
      }

      entry.sets.forEach((set) => {
        lines.push(`   - ${this.formatSetLine(set)}`);
      });

      if (entry.source_url?.trim()) {
        lines.push(`   參考：${entry.source_url.trim()}`);
      }

      lines.push('');
    });

    return lines.join('\n').trim();
  }

  private formatSetLine(set: FitEntrySet): string {
    const parts: string[] = [];

    parts.push(`第 ${set.set_no} 組`);

    if (set.weight_value !== null) {
      parts.push(
        `重量 ${set.weight_value}${set.weight_unit ? ` ${set.weight_unit}` : ''}`,
      );
    }

    if (set.reps_value !== null) {
      parts.push(`次數 ${set.reps_value}`);
    }

    if (set.duration_sec !== null) {
      parts.push(`時間 ${set.duration_sec} 秒`);
    }

    if (set.calories_value !== null) {
      parts.push(`卡路里 ${set.calories_value}`);
    }

    if (set.distance_value !== null) {
      parts.push(
        `距離 ${set.distance_value}${set.distance_unit ? ` ${set.distance_unit}` : ''}`,
      );
    }

    if (set.level_text?.trim()) {
      parts.push(`等級 ${set.level_text.trim()}`);
    }

    if (set.side_code) {
      parts.push(`側別 ${this.getSideLabel(set.side_code)}`);
    }

    if (set.remarks?.trim()) {
      parts.push(`備註 ${set.remarks.trim()}`);
    }

    return parts.join(' · ');
  }

  private getSideLabel(side: FitSideCode): string {
    if (side === 'left') return 'Left';
    if (side === 'right') return 'Right';
    return 'Both';
  }
}