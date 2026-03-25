import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

import { HeaderService } from '../../core/services/header.service';
import { UserService } from '../user/user.service';
import { EmploymentService } from './employment.service';
import { DisplayNamePipe } from '../../core/pipes/display-name.pipe';
import { exportToCsv } from '../../core/utils/csv-export.util';

@Component({
  selector: 'app-employment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [DisplayNamePipe],
  templateUrl: './employment-list.html',
})
export class EmploymentList implements OnInit, OnDestroy {
  public employmentService = inject(EmploymentService);
  public userService = inject(UserService);

  private headerService = inject(HeaderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private displayNamePipe = inject(DisplayNamePipe);

  rawListVM = computed(() => {
    const employments = this.employmentService.employments();
    const users = this.userService.users();

    return employments.map((emp) => {
      const user = users.find((u) => u.user_id === emp.user_id);
      return {
        ...emp,
        manageUserName: user
          ? this.displayNamePipe.transform(user)
          : 'Unknown User',
      };
    });
  });

  ngOnInit() {
    const isLoading = computed(
      () => this.employmentService.loading() || this.userService.loading(),
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
          label: 'Export',
          icon: 'download',
          type: 'secondary',
          disabled: isLoading,
          onClick: () => this.onExport(),
        },
        {
          label: 'New Employment',
          icon: 'add',
          type: 'primary',
          disabled: isLoading,
          onClick: () =>
            this.router.navigate(['../new'], { relativeTo: this.route }),
        },
      ],
    });

    this.employmentService.fetchAllEmployments();
    this.userService.fetchAllUsers();
  }

  async onRefresh() {
    await this.employmentService.fetchAllEmployments(true);
    await this.userService.fetchAllUsers(true);
  }

  onExport() {
    const records = this.rawListVM();
    if (!records.length) return;

    const headers = [
      'Employer (EN)',
      'Employer (ZH)',
      'Position',
      'Workload',
      'Type',
      'User',
      'Status',
    ];
    const rows: string[][] = records.map((r) => [
      r.employer_name_en || '',
      r.employer_name_zh || '',
      r.position_title_en || '',
      r.workload_type || '',
      r.employment_type || '',
      r.manageUserName,
      r.status === 1 ? 'Active' : 'Inactive',
    ]);

    exportToCsv(
      `Employment_Records_${new Date().toISOString().split('T')[0]}`,
      headers,
      rows,
    );
  }

  ngOnDestroy() {
    this.headerService.clear();
  }
}
