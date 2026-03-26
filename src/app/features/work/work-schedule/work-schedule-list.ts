import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

import { HeaderService } from '../../../core/services/header.service';
import { UserService } from '../../user/user.service';
import { WorkEmploymentService } from '../work-employment/work-employment.service';
import { WorkScheduleService } from './work-schedule.service';
import { DisplayNamePipe } from '../../../core/pipes/display-name.pipe';

@Component({
  selector: 'app-work-schedule-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [DisplayNamePipe, DatePipe],
  templateUrl: './work-schedule-list.html',
})
export class WorkScheduleList implements OnInit, OnDestroy {
  public workScheduleService = inject(WorkScheduleService);
  public workEmploymentService = inject(WorkEmploymentService);
  public userService = inject(UserService);

  private headerService = inject(HeaderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private displayNamePipe = inject(DisplayNamePipe);
  private datePipe = inject(DatePipe);

  listVM = computed(() => {
    const schedules = this.workScheduleService.workSchedules();
    const users = this.userService.users();
    const employments = this.workEmploymentService.workEmployments();

    return schedules.map((scdl) => {
      const user = users.find((u) => u.user_id === scdl.user_id);
      const emp = employments.find(
        (e) => e.tb_tyapp_wk_mplm_id === scdl.mplm_id,
      );

      let timeString = 'Day Off';
      if (
        !scdl.is_day_off &&
        scdl.planned_start_time &&
        scdl.planned_end_time
      ) {
        const start = this.datePipe.transform(scdl.planned_start_time, 'HH:mm');
        const end = this.datePipe.transform(scdl.planned_end_time, 'HH:mm');
        timeString = `${start} - ${end}`;
      }

      return {
        ...scdl,
        manageUserName: user
          ? this.displayNamePipe.transform(user)
          : 'Unknown User',
        employmentName: emp
          ? `${emp.employer_name_en} (${emp.position_title_en})`
          : 'Unassigned',
        displayTime: timeString,
      };
    });
  });

  ngOnInit() {
    const isLoading = computed(
      () =>
        this.workScheduleService.loading() ||
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
          label: 'New Schedule',
          icon: 'add',
          type: 'primary',
          disabled: isLoading,
          onClick: () =>
            this.router.navigate(['../new'], { relativeTo: this.route }),
        },
      ],
    });

    this.workScheduleService.fetchAllWorkSchedules();
    this.workEmploymentService.fetchAllWorkEmployments();
    this.userService.fetchAllUsers();
  }

  async onRefresh() {
    await this.workScheduleService.fetchAllWorkSchedules(true);
    await this.workEmploymentService.fetchAllWorkEmployments(true);
    await this.userService.fetchAllUsers(true);
  }

  ngOnDestroy() {
    this.headerService.clear();
  }
}
