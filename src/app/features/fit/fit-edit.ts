import { CommonModule } from '@angular/common';
import {
  Component,
  DoCheck,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
  HeaderAction,
  HeaderService,
} from '../../core/services/header.service';
import { AuthService } from '../../core/services/auth.service';
import { FitService } from './fit.service';
import {
  FitEditEntryInput,
  FitEditSessionInput,
  FitEditSetInput,
  FitEntryType,
  FitSessionDetail,
} from './fit.model';

type FitEditVm = FitEditSessionInput;

@Component({
  selector: 'app-fit-edit',
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
    MatDatepickerModule,
    MatSlideToggleModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './fit-edit.html',
  styleUrl: './fit-edit.scss',
})
export class FitEdit implements OnInit, OnDestroy, DoCheck {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private headerService = inject(HeaderService);
  private authService = inject(AuthService);

  public fitService = inject(FitService);

  item = signal<FitEditVm | null>(null);
  currentId: string | null = null;
  returnUrl = '/fit/list';

  originalDataStr = signal<string>('');
  isDirty = signal(false);
  isSaveDisabled = signal(true);

  entryTypeOptions: FitEntryType[] = [
    'strength',
    'cardio',
    'mobility',
    'bodyweight',
  ];

  sideCodeOptions = [
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
    { value: 'both', label: 'Both' },
  ];

  syncStatus = computed<'loading' | 'up-to-date' | 'unsaved' | 'none'>(() => {
    if (this.fitService.loading()) return 'loading';
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

    if (!current || !original) return;

    const currentlyDirty = JSON.stringify(current) !== original;
    if (this.isDirty() !== currentlyDirty) {
      this.isDirty.set(currentlyDirty);
    }

    const disabled =
      this.fitService.loading() ||
      (!!this.currentId && !currentlyDirty) ||
      !current.session_date ||
      !(current.entries || []).length ||
      !this.hasValidEntries(current);

    if (this.isSaveDisabled() !== disabled) {
      this.isSaveDisabled.set(disabled);
    }
  }

  async ngOnInit() {
    this.currentId = this.route.snapshot.paramMap.get('id');
    this.returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || '/fit/list';

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
      label: this.currentId ? 'Save Changes' : 'Create Session',
      icon: 'check',
      type: 'primary',
      disabled: this.isSaveDisabled,
      onClick: () => this.onSave(),
    });

    this.headerService.setConfig({
      backLink: this.returnUrl,
      syncStatus: this.syncStatus,
      actions,
    });

    if (this.currentId) {
      const detail = await this.fitService.fetchSessionDetail(this.currentId);

      if (!detail) {
        this.router.navigateByUrl(this.returnUrl);
        return;
      }

      const vm = this.mapDetailToVm(detail);
      this.item.set(vm);
      this.originalDataStr.set(JSON.stringify(vm));
    } else {
      const newItem = this.createNewItem();
      this.item.set(newItem);
      this.originalDataStr.set(JSON.stringify(newItem));
    }
  }

  ngOnDestroy() {
    this.headerService.clear();
  }

  canDeactivate() {
    return !this.isDirty();
  }

  addEntry(type: FitEntryType = 'strength') {
    this.item.update((current) => {
      if (!current) return current;

      const nextEntries = [...(current.entries || [])];
      nextEntries.push(this.createNewEntry(type, nextEntries.length + 1));

      return {
        ...current,
        entries: nextEntries,
      };
    });
  }

  removeEntry(index: number) {
    this.item.update((current) => {
      if (!current) return current;

      const nextEntries = [...(current.entries || [])];
      nextEntries.splice(index, 1);

      return {
        ...current,
        entries: nextEntries.map((entry, i) => ({
          ...entry,
          sort_order: i + 1,
          sets: (entry.sets || []).map((set, setIndex) => ({
            ...set,
            set_no: setIndex + 1,
          })),
        })),
      };
    });
  }

  addSet(entryIndex: number) {
    this.item.update((current) => {
      if (!current) return current;

      const nextEntries = [...(current.entries || [])];
      const target = nextEntries[entryIndex];
      if (!target) return current;

      const nextSets = [...(target.sets || [])];

      const lastSet =
        nextSets.length > 0 ? nextSets[nextSets.length - 1] : null;

      const newSet: FitEditSetInput = lastSet
        ? {
            ...structuredClone(lastSet),
            id: null,
            set_no: nextSets.length + 1,
            remarks: '',
          }
        : this.createNewSet(nextSets.length + 1);

      nextSets.push(newSet);

      nextEntries[entryIndex] = {
        ...target,
        sets: nextSets,
      };

      return {
        ...current,
        entries: nextEntries,
      };
    });
  }

  removeSet(entryIndex: number, setIndex: number) {
    this.item.update((current) => {
      if (!current) return current;

      const nextEntries = [...(current.entries || [])];
      const target = nextEntries[entryIndex];
      if (!target) return current;

      const nextSets = [...(target.sets || [])];
      nextSets.splice(setIndex, 1);

      nextEntries[entryIndex] = {
        ...target,
        sets: nextSets.map((set, i) => ({
          ...set,
          set_no: i + 1,
        })),
      };

      return {
        ...current,
        entries: nextEntries,
      };
    });
  }

  duplicateFirstSet(entryIndex: number, count: number) {
    if (count <= 1) return;

    this.item.update((current) => {
      if (!current) return current;

      const nextEntries = [...(current.entries || [])];
      const target = nextEntries[entryIndex];
      if (!target) return current;

      const firstSet = target.sets?.[0];
      if (!firstSet) return current;

      const nextSets: FitEditSetInput[] = Array.from(
        { length: count },
        (_, i) => ({
          ...structuredClone(firstSet),
          id: null,
          set_no: i + 1,
        }),
      );

      nextEntries[entryIndex] = {
        ...target,
        sets: nextSets,
      };

      return {
        ...current,
        entries: nextEntries,
      };
    });
  }

  onEntryTypeChange(entryIndex: number, type: FitEntryType) {
    this.item.update((current) => {
      if (!current) return current;

      const nextEntries = [...(current.entries || [])];
      const target = nextEntries[entryIndex];
      if (!target) return current;

      nextEntries[entryIndex] = {
        ...target,
        entry_type: type,
      };

      return {
        ...current,
        entries: nextEntries,
      };
    });
  }

  updateEntryField(
    entryIndex: number,
    field: keyof FitEditEntryInput,
    value: string | number | null,
  ) {
    this.item.update((current) => {
      if (!current) return current;

      const nextEntries = [...(current.entries || [])];
      const target = nextEntries[entryIndex];
      if (!target) return current;

      nextEntries[entryIndex] = {
        ...target,
        [field]: value,
      };

      return {
        ...current,
        entries: nextEntries,
      };
    });
  }

  updateSetField(
    entryIndex: number,
    setIndex: number,
    field: keyof FitEditSetInput,
    value: string | number | null,
  ) {
    this.item.update((current) => {
      if (!current) return current;

      const nextEntries = [...(current.entries || [])];
      const targetEntry = nextEntries[entryIndex];
      if (!targetEntry) return current;

      const nextSets = [...(targetEntry.sets || [])];
      const targetSet = nextSets[setIndex];
      if (!targetSet) return current;

      nextSets[setIndex] = {
        ...targetSet,
        [field]: value,
      };

      nextEntries[entryIndex] = {
        ...targetEntry,
        sets: nextSets,
      };

      return {
        ...current,
        entries: nextEntries,
      };
    });
  }

  async onSave() {
    const current = this.item();
    if (!current || this.isSaveDisabled()) return;

    const payload = this.normalizePayload(current);
    const success = await this.fitService.saveSession(payload);

    if (success) {
      this.originalDataStr.set(JSON.stringify(payload));
      this.isDirty.set(false);
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  async onDelete() {
    if (!this.currentId) return;

    if (confirm('Are you sure you want to delete this fit session?')) {
      const success = await this.fitService.deleteSession(this.currentId);
      if (success) {
        this.isDirty.set(false);
        this.router.navigateByUrl(this.returnUrl);
      }
    }
  }

  private createNewItem(): FitEditVm {
    const today = new Date();
    const localDate = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split('T')[0];

    return {
      id: null,
      session_date: localDate,
      session_title: '',
      location: '',
      remarks: '',
      status: 1,
      entries: [this.createNewEntry('strength', 1)],
    };
  }

  private createNewEntry(
    type: FitEntryType,
    sortOrder: number,
  ): FitEditEntryInput {
    return {
      id: null,
      sort_order: sortOrder,
      entry_type: type,
      exercise_name: '',
      source_url: '',
      remarks: '',
      status: 1,
      showAdvanced: false,
      sets: [this.createNewSet(1)],
    };
  }

  private createNewSet(setNo: number): FitEditSetInput {
    return {
      id: null,
      set_no: setNo,
      weight_value: null,
      weight_unit: '',
      reps_value: null,
      duration_sec: null,
      calories_value: null,
      distance_value: null,
      distance_unit: '',
      level_text: '',
      side_code: null,
      remarks: '',
      status: 1,
    };
  }

  private mapDetailToVm(detail: FitSessionDetail): FitEditVm {
    return {
      id: detail.session.tb_tyapp_fit_ssn_id,
      session_date: detail.session.session_date,
      session_title: detail.session.session_title || '',
      location: detail.session.location || '',
      remarks: detail.session.remarks || '',
      status: detail.session.status ?? 1,
      entries: (detail.entries || []).map((entry, entryIndex) => ({
        id: entry.tb_tyapp_fit_ntry_id,
        sort_order: entry.sort_order ?? entryIndex + 1,
        entry_type: entry.entry_type,
        exercise_name: entry.exercise_name || '',
        source_url: entry.source_url || '',
        remarks: entry.remarks || '',
        status: entry.status ?? 1,
        sets: (entry.sets || []).map((set, setIndex) => ({
          id: set.tb_tyapp_fit_set_id,
          set_no: set.set_no ?? setIndex + 1,
          weight_value: set.weight_value ?? null,
          weight_unit: set.weight_unit || '',
          reps_value: set.reps_value ?? null,
          duration_sec: set.duration_sec ?? null,
          calories_value: set.calories_value ?? null,
          distance_value: set.distance_value ?? null,
          distance_unit: set.distance_unit || '',
          level_text: set.level_text || '',
          side_code: set.side_code || null,
          remarks: set.remarks || '',
          status: set.status ?? 1,
        })),
      })),
    };
  }

  private normalizePayload(current: FitEditVm): FitEditSessionInput {
    return {
      id: current.id ?? null,
      session_date: current.session_date,
      session_title: this.normalizeText(current.session_title),
      location: this.normalizeText(current.location),
      remarks: this.normalizeText(current.remarks),
      status: current.status ?? 1,
      entries: (current.entries || []).map((entry, entryIndex) => ({
        id: entry.id ?? null,
        sort_order: entryIndex + 1,
        entry_type: entry.entry_type,
        exercise_name: this.normalizeText(entry.exercise_name) || '',
        source_url: this.normalizeText(entry.source_url),
        remarks: this.normalizeText(entry.remarks),
        status: entry.status ?? 1,
        sets: (entry.sets || []).map((set, setIndex) => ({
          id: set.id ?? null,
          set_no: setIndex + 1,
          weight_value: this.normalizeNumber(set.weight_value),
          weight_unit: this.normalizeText(set.weight_unit),
          reps_value: this.normalizeInteger(set.reps_value),
          duration_sec: this.normalizeInteger(set.duration_sec),
          calories_value: this.normalizeNumber(set.calories_value),
          distance_value: this.normalizeNumber(set.distance_value),
          distance_unit: this.normalizeText(set.distance_unit),
          level_text: this.normalizeText(set.level_text),
          side_code: set.side_code ?? null,
          remarks: this.normalizeText(set.remarks),
          status: set.status ?? 1,
        })),
      })),
    };
  }

  private hasValidEntries(current: FitEditVm): boolean {
    return (current.entries || []).every(
      (entry) =>
        !!entry.entry_type &&
        !!entry.exercise_name?.trim() &&
        !!entry.sets?.length,
    );
  }

  private normalizeText(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text ? text : null;
  }

  private normalizeNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  }

  private normalizeInteger(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : Math.trunc(num);
  }
}
