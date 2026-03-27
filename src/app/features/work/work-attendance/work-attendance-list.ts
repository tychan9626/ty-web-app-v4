import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

import { HeaderService } from '../../../core/services/header.service';
import { UserService } from '../../user/user.service';
import { WorkEmploymentService } from '../work-employment/work-employment.service';
import { WorkAttendanceService } from './work-attendance.service';
import { DisplayNamePipe } from '../../../core/pipes/display-name.pipe';
import { parseLocalDate } from '../../../core/utils/date-time.util';

@Component({
  selector: 'app-work-attendance-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [DisplayNamePipe, DatePipe],
  templateUrl: './work-attendance-list.html',
})
export class WorkAttendanceList implements OnInit, OnDestroy {
  public workAttendanceService = inject(WorkAttendanceService);
  public workEmploymentService = inject(WorkEmploymentService);
  public userService = inject(UserService);

  private headerService = inject(HeaderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private displayNamePipe = inject(DisplayNamePipe);
  private datePipe = inject(DatePipe);

  listVM = computed(() => {
    const attendances = this.workAttendanceService.workAttendances();
    const users = this.userService.users();
    const employments = this.workEmploymentService.workEmployments();

    return attendances.map((attn) => {
      const user = users.find((u) => u.user_id === attn.user_id);
      const emp = employments.find(
        (e) => e.tb_tyapp_wk_mplm_id === attn.mplm_id,
      );

      let timeString = 'Day Off';
      if (!attn.is_day_off && attn.start_time) {
        const start = this.datePipe.transform(attn.start_time, 'HH:mm');
        const end = attn.end_time
          ? this.datePipe.transform(attn.end_time, 'HH:mm')
          : 'Ongoing';
        timeString = `${start} - ${end}`;
      }

      return {
        ...attn,
        manageUserName: user
          ? this.displayNamePipe.transform(user)
          : 'Unknown User',
        employmentName: emp
          ? `${emp.employer_name_en} (${emp.position_title_en})`
          : 'Unassigned',
        displayTime: timeString,
        hasSecretLog: !!attn.log_is_secret && !!attn.log,
      };
    });
  });

  getWeekRangeLabel(dateStr: string): string {
    const d = parseLocalDate(dateStr);
    if (!d) return 'Unknown Week';

    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${monday.toLocaleDateString('en-US', opts)} - ${sunday.toLocaleDateString('en-US', opts)}, ${sunday.getFullYear()}`;
  }

  groupedListVM = computed(() => {
    const flatList = this.listVM();
    const groups: { weekLabel: string; items: typeof flatList }[] = [];

    let currentGroup: { weekLabel: string; items: typeof flatList } | null =
      null;

    for (const item of flatList) {
      const label = this.getWeekRangeLabel(item.work_date);

      if (!currentGroup || currentGroup.weekLabel !== label) {
        currentGroup = { weekLabel: label, items: [] };
        groups.push(currentGroup);
      }
      currentGroup.items.push(item);
    }

    return groups;
  });

  ngOnInit() {
    const isLoading = computed(
      () =>
        this.workAttendanceService.loading() ||
        this.userService.loading() ||
        this.workEmploymentService.loading(),
    );

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
          label: 'New Record',
          icon: 'add',
          type: 'primary',
          disabled: isLoading,
          onClick: () =>
            this.router.navigate(['../new'], { relativeTo: this.route }),
        },
      ],
    });

    this.workAttendanceService.fetchAllWorkAttendances();
    this.workEmploymentService.fetchAllWorkEmployments();
    this.userService.fetchAllUsers();
  }

  async onRefresh() {
    await this.workAttendanceService.fetchAllWorkAttendances(true);
    await this.workEmploymentService.fetchAllWorkEmployments(true);
    await this.userService.fetchAllUsers(true);
  }

  ngOnDestroy() {
    this.headerService.clear();
  }
}
