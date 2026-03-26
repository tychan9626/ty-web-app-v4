import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  DoCheck,
  HostListener,
  inject,
  NgZone,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import {
  HeaderService,
  HeaderAction,
} from '../../../core/services/header.service';
import { UserService } from '../../user/user.service';
import { WorkEmploymentService } from '../work-employment/work-employment.service';
import { WorkSchedule } from './work-schedule.model';
import { WorkScheduleService } from './work-schedule.service';
import { SelectOption } from '../../../core/models/common.model';
import { DisplayNamePipe } from '../../../core/pipes/display-name.pipe';

@Component({
  selector: 'app-work-schedule-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
  ],
  providers: [DisplayNamePipe],
  templateUrl: './work-schedule-edit.html',
})
export class WorkScheduleEdit implements OnInit, OnDestroy, DoCheck {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private zone = inject(NgZone);
  private headerService = inject(HeaderService);
  private displayNamePipe = inject(DisplayNamePipe);

  public workScheduleService = inject(WorkScheduleService);
  public workEmploymentService = inject(WorkEmploymentService);
  public userService = inject(UserService);
  public authService = inject(AuthService);

  item = signal<Partial<WorkSchedule> | null>(null);
  currentId: string | null = null;
  originalDataStr = signal<string>('');

  isDirty = signal(false);
  isSaveDisabled = signal(true);

  timeInputs = signal({ start: '', end: '' });
  bindDate = signal<Date | null>(null);

  userSearch = signal<string>('');
  userOptions = computed<SelectOption[]>(() =>
    this.userService
      .users()
      .map((u) => ({
        value: u.user_id,
        label: this.displayNamePipe.transform(u),
      })),
  );
  filteredUsers = computed(() => {
    const q = this.userSearch().toLowerCase();
    return q
      ? this.userOptions().filter((opt) => opt.label.toLowerCase().includes(q))
      : this.userOptions();
  });

  filteredEmployments = computed(() => {
    const currentUserId = this.item()?.user_id;
    return this.workEmploymentService
      .workEmployments()
      .filter(
        (e) =>
          e.status === 1 && (!currentUserId || e.user_id === currentUserId),
      );
  });

  syncStatus = computed<'loading' | 'up-to-date' | 'unsaved' | 'none'>(() => {
    if (this.workScheduleService.loading()) return 'loading';
    if (this.isDirty()) return 'unsaved';
    if (this.currentId) return 'up-to-date';
    return 'none';
  });

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.isDirty()) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  ngDoCheck() {
    const current = this.item();
    const original = this.originalDataStr();

    if (current && original) {
      const dateVal = this.bindDate();
      current.work_date = dateVal ? this.formatDate(dateVal) : '';

      const currentlyDirty =
        JSON.stringify(current) !== original ||
        JSON.stringify(this.timeInputs()) !==
          sessionStorage.getItem('orig_times');

      if (this.isDirty() !== currentlyDirty) {
        this.isDirty.set(currentlyDirty);
      }

      const disabled =
        this.workScheduleService.loading() ||
        !currentlyDirty ||
        !current.user_id ||
        !current.work_date ||
        (!current.is_day_off && !current.mplm_id);

      if (this.isSaveDisabled() !== disabled) {
        this.isSaveDisabled.set(disabled);
      }
    }
  }

  displayUserName(id: string): string {
    const found = this.userOptions().find((opt) => opt.value === id);
    return found ? found.label : '';
  }

  private formatDate(d: Date): string {
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];
  }

  private extractTime(isoString: string | null | undefined): string {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private buildIsoString(dateStr: string, timeStr: string): string {
    if (!timeStr) return '';
    return new Date(`${dateStr}T${timeStr}:00`).toISOString();
  }

  async ngOnInit() {
    this.currentId = this.route.snapshot.paramMap.get('id');

    await Promise.all([
      this.workScheduleService.fetchAllWorkSchedules(),
      this.workEmploymentService.fetchAllWorkEmployments(),
      this.userService.fetchAllUsers(),
    ]);

    const actions: HeaderAction[] = [];
    if (this.currentId) {
      actions.push({
        label: 'Delete',
        icon: 'delete_outline',
        type: 'secondary',
        onClick: () => this.onDelete(),
      });
    }
    actions.push({
      label: this.currentId ? 'Save Changes' : 'Create Record',
      icon: 'check',
      type: 'primary',
      disabled: this.isSaveDisabled,
      onClick: () => this.onSave(),
    });

    this.headerService.setConfig({
      backLink: '/work/schedule/list',
      syncStatus: this.syncStatus,
      actions: actions,
    });

    if (this.currentId) {
      const fresh = await this.workScheduleService.fetchWorkScheduleById(
        this.currentId,
      );
      this.zone.run(() => {
        if (fresh) {
          this.item.set(structuredClone(fresh));
          this.originalDataStr.set(JSON.stringify(fresh));
          this.userSearch.set(fresh.user_id);
          this.bindDate.set(new Date(fresh.work_date));

          const times = {
            start: this.extractTime(fresh.planned_start_time),
            end: this.extractTime(fresh.planned_end_time),
          };
          this.timeInputs.set(times);
          sessionStorage.setItem('orig_times', JSON.stringify(times));
        } else {
          this.router.navigate(['/work/schedule/list']);
        }
      });
    } else {
      const newScdl: Partial<WorkSchedule> = {
        user_id: this.authService.userProfile()?.user_id || '',
        work_date: '',
        is_day_off: false,
        planned_meal_minutes: 60,
        status: 1,
      };
      this.item.set(newScdl);
      this.originalDataStr.set(JSON.stringify(newScdl));
      sessionStorage.setItem(
        'orig_times',
        JSON.stringify({ start: '', end: '' }),
      );
      this.userSearch.set(newScdl.user_id!);
    }
  }

  async onSave() {
    const data = this.item();
    const dateVal = this.bindDate();
    if (!data || !data.user_id || !dateVal) return;

    data.work_date = this.formatDate(dateVal);

    if (data.is_day_off) {
      data.planned_start_time = null;
      data.planned_end_time = null;
      data.planned_meal_minutes = 0;
    } else {
      const times = this.timeInputs();
      data.planned_start_time = this.buildIsoString(
        data.work_date,
        times.start,
      );
      data.planned_end_time = this.buildIsoString(data.work_date, times.end);
    }

    const success = await this.workScheduleService.saveWorkSchedule(data);
    if (success) {
      this.isDirty.set(false);
      sessionStorage.removeItem('orig_times');
      this.router.navigate(['/work/schedule/list']);
    }
  }

  async onDelete() {
    if (!this.currentId) return;
    if (confirm('Are you sure you want to delete this schedule?')) {
      const success = await this.workScheduleService.deleteWorkSchedule(
        this.currentId,
      );
      if (success) {
        this.isDirty.set(false);
        this.router.navigate(['/work/schedule/list']);
      }
    }
  }

  ngOnDestroy() {
    this.headerService.clear();
    sessionStorage.removeItem('orig_times');
  }
}
