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
import {
  parseLocalDate,
  formatDate,
  extractTime,
  buildIsoString,
  buildSequentialIsoStrings,
} from '../../../core/utils/date-time.util';

import { AuthService } from '../../../core/services/auth.service';
import {
  HeaderService,
  HeaderAction,
} from '../../../core/services/header.service';
import { UserService } from '../../user/user.service';
import { WorkEmploymentService } from '../work-employment/work-employment.service';
import { WorkAttendance } from './work-attendance.model';
import { WorkAttendanceService } from './work-attendance.service';
import { SelectOption } from '../../../core/models/common.model';
import { DisplayNamePipe } from '../../../core/pipes/display-name.pipe';

@Component({
  selector: 'app-work-attendance-edit',
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
  templateUrl: './work-attendance-edit.html',
})
export class WorkAttendanceEdit implements OnInit, OnDestroy, DoCheck {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private zone = inject(NgZone);
  private headerService = inject(HeaderService);
  private displayNamePipe = inject(DisplayNamePipe);

  public workAttendanceService = inject(WorkAttendanceService);
  public workEmploymentService = inject(WorkEmploymentService);
  public userService = inject(UserService);
  public authService = inject(AuthService);

  item = signal<Partial<WorkAttendance> | null>(null);
  currentId: string | null = null;
  originalDataStr = signal<string>('');

  isDirty = signal(false);
  isSaveDisabled = signal(true);

  timeInputs = signal({
    start: '',
    end: '',
    meal_start: '',
    meal_end: '',
    break_start: '',
    break_end: '',
  });
  bindDate = signal<Date | null>(null);

  userSearch = signal<string>('');
  userOptions = computed<SelectOption[]>(() =>
    this.userService.users().map((u) => ({
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
    if (this.workAttendanceService.loading()) return 'loading';
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
      current.work_date = dateVal ? formatDate(dateVal) : '';

      const currentlyDirty =
        JSON.stringify(current) !== original ||
        JSON.stringify(this.timeInputs()) !==
          sessionStorage.getItem('orig_times');

      if (this.isDirty() !== currentlyDirty) {
        this.isDirty.set(currentlyDirty);
      }

      const disabled =
        this.workAttendanceService.loading() ||
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

  async ngOnInit() {
    this.currentId = this.route.snapshot.paramMap.get('id');

    if (this.currentId) {
      const cached = this.workAttendanceService
        .workAttendances()
        .find((a) => a.tb_tyapp_wk_attn_id === this.currentId);
      if (cached) {
        this.item.set(structuredClone(cached));
        this.originalDataStr.set(JSON.stringify(cached));
        this.userSearch.set(cached.user_id);
        this.bindDate.set(parseLocalDate(cached.work_date));

        const times = {
          start: extractTime(cached.start_time),
          end: extractTime(cached.end_time),
          meal_start: extractTime(cached.meal_start_time),
          meal_end: extractTime(cached.meal_end_time),
          break_start: extractTime(cached.break_start_time),
          break_end: extractTime(cached.break_end_time),
        };
        this.timeInputs.set(times);
        sessionStorage.setItem('orig_times', JSON.stringify(times));
      }
    } else {
      const newAttn: Partial<WorkAttendance> = {
        user_id: this.authService.userProfile()?.user_id || '',
        work_date: '',
        is_day_off: false,
        log_is_secret: false,
        status: 1,
      };
      this.item.set(newAttn);
      this.originalDataStr.set(JSON.stringify(newAttn));
      const initTimes = {
        start: '',
        end: '',
        meal_start: '',
        meal_end: '',
        break_start: '',
        break_end: '',
      };
      sessionStorage.setItem('orig_times', JSON.stringify(initTimes));
      this.userSearch.set(newAttn.user_id!);
    }

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
      backLink: '/work/attendance/list',
      syncStatus: this.syncStatus,
      actions: actions,
    });

    Promise.all([
      this.workEmploymentService.fetchAllWorkEmployments(),
      this.userService.fetchAllUsers(),
    ]);

    if (this.currentId) {
      const fresh = await this.workAttendanceService.fetchWorkAttendanceById(
        this.currentId,
      );
      this.zone.run(() => {
        if (fresh) {
          this.item.set(structuredClone(fresh));
          this.originalDataStr.set(JSON.stringify(fresh));
          this.userSearch.set(fresh.user_id);
          this.bindDate.set(parseLocalDate(fresh.work_date));

          const times = {
            start: extractTime(fresh.start_time),
            end: extractTime(fresh.end_time),
            meal_start: extractTime(fresh.meal_start_time),
            meal_end: extractTime(fresh.meal_end_time),
            break_start: extractTime(fresh.break_start_time),
            break_end: extractTime(fresh.break_end_time),
          };
          this.timeInputs.set(times);
          sessionStorage.setItem('orig_times', JSON.stringify(times));
        } else if (!this.item()) {
          this.router.navigate(['/work/attendance/list']);
        }
      });
    }
  }

  async onSave() {
    const data = this.item();
    const dateVal = this.bindDate();
    if (!data || !data.user_id || !dateVal) return;

    data.work_date = formatDate(dateVal);

    if (data.is_day_off) {
      data.start_time = null;
      data.end_time = null;
      data.meal_start_time = null;
      data.meal_end_time = null;
      data.break_start_time = null;
      data.break_end_time = null;
    } else {
      const times = this.timeInputs();

      const sequence = [
        times.start,
        times.meal_start,
        times.meal_end,
        times.break_start,
        times.break_end,
        times.end,
      ];

      const isoResults = buildSequentialIsoStrings(data.work_date, sequence);

      data.start_time = isoResults[0];
      data.meal_start_time = isoResults[1];
      data.meal_end_time = isoResults[2];
      data.break_start_time = isoResults[3];
      data.break_end_time = isoResults[4];
      data.end_time = isoResults[5];
    }

    const success = await this.workAttendanceService.saveWorkAttendance(data);
    if (success) {
      this.isDirty.set(false);
      sessionStorage.removeItem('orig_times');
      this.router.navigate(['/work/attendance/list']);
    }
  }

  async onDelete() {
    if (!this.currentId) return;
    if (confirm('Are you sure you want to delete this attendance record?')) {
      const success = await this.workAttendanceService.deleteWorkAttendance(
        this.currentId,
      );
      if (success) {
        this.isDirty.set(false);
        this.router.navigate(['/work/attendance/list']);
      }
    }
  }

  ngOnDestroy() {
    this.headerService.clear();
    sessionStorage.removeItem('orig_times');
  }
}
