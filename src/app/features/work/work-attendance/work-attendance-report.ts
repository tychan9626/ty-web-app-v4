import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  computed,
  signal,
} from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';

import { HeaderService } from '../../../core/services/header.service';
import { WorkAttendanceService } from './work-attendance.service';
import { WorkEmploymentService } from '../work-employment/work-employment.service';
import {
  calculateWorkingHours,
  getWeekRangeLabel,
  getBiWeeklyRangeLabel,
  groupItemsByPeriod,
} from '../../../core/utils/date-time.util';

@Component({
  selector: 'app-work-attendance-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './work-attendance-report.html',
  styleUrl: './work-attendance-report.scss',
})
export class WorkAttendanceReport implements OnInit, OnDestroy {
  public workAttendanceService = inject(WorkAttendanceService);
  public workEmploymentService = inject(WorkEmploymentService);
  private headerService = inject(HeaderService);

  viewMode = signal<'weekly' | 'biweekly'>('biweekly');

  reportDataVM = computed(() => {
    const attendances = this.workAttendanceService.workAttendances();
    const employments = this.workEmploymentService.workEmployments();

    const validRecords = attendances.filter(
      (a) => a.status === 1 && !a.is_day_off && a.mplm_id,
    );

    const enrichedRecords = validRecords.map((a) => {
      const hours = calculateWorkingHours(
        a.start_time,
        a.end_time,
        a.meal_start_time,
        a.meal_end_time,
        a.is_day_off,
      );
      const emp = employments.find((e) => e.tb_tyapp_wk_mplm_id === a.mplm_id);
      return {
        ...a,
        hours,
        mplm_id: a.mplm_id || 'unknown_id',
        employmentName: emp
          ? `${emp.employer_name_en} (${emp.position_title_en})`
          : 'Unknown Employment',
      };
    });

    type EnrichedRecord = (typeof enrichedRecords)[0];

    const isWeekly = this.viewMode() === 'weekly';
    const labelGenerator = isWeekly
      ? (item: EnrichedRecord) => getWeekRangeLabel(item.work_date || '')
      : (item: EnrichedRecord) => getBiWeeklyRangeLabel(item.work_date || '');

    const periodGroups = groupItemsByPeriod(enrichedRecords, labelGenerator);

    const finalReport = periodGroups.map((pg) => {
      const empMap = new Map<
        string,
        { employmentName: string; totalHours: number; recordCount: number }
      >();
      let periodTotalHours = 0;

      for (const item of pg.items) {
        const empId = item.mplm_id;
        if (!empMap.has(empId)) {
          empMap.set(empId, {
            employmentName: item.employmentName,
            totalHours: 0,
            recordCount: 0,
          });
        }

        const currentData = empMap.get(empId)!;
        currentData.totalHours += item.hours;
        currentData.recordCount += 1;

        periodTotalHours += item.hours;
      }

      const employmentDetails = Array.from(empMap.entries())
        .map(([id, data]) => ({
          mplm_id: id,
          employmentName: data.employmentName,
          totalHours: Math.round(data.totalHours * 100) / 100,
          recordCount: data.recordCount,
        }))
        .sort((a, b) => b.totalHours - a.totalHours);

      return {
        periodLabel: pg.periodLabel,
        periodTotalHours: Math.round(periodTotalHours * 100) / 100,
        employments: employmentDetails,
      };
    });

    return finalReport;
  });

  ngOnInit() {
    const isLoading = computed(
      () =>
        this.workAttendanceService.loading() ||
        this.workEmploymentService.loading(),
    );

    this.headerService.setConfig({
      backLink: '/work/attendance/list',
      actions: [
        {
          label: 'Refresh',
          icon: 'refresh',
          type: 'secondary',
          disabled: isLoading,
          onClick: () => this.onRefresh(),
        },
      ],
    });

    this.workAttendanceService.fetchAllWorkAttendances();
    this.workEmploymentService.fetchAllWorkEmployments();
  }

  async onRefresh() {
    await this.workAttendanceService.fetchAllWorkAttendances(true);
    await this.workEmploymentService.fetchAllWorkEmployments(true);
  }

  ngOnDestroy() {
    this.headerService.clear();
  }
}
