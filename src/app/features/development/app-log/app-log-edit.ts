import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppLogService } from './app-log.service';
import { AppLog } from './app-log.model';
import { AppCategoryService } from '../app-category/app-category.service';

@Component({
  selector: 'app-app-log-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './app-log-edit.html',
})
export class AppLogEdit implements OnInit {
  private fb = inject(FormBuilder);
  appLogService = inject(AppLogService);
  appCategoryService = inject(AppCategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEditMode = false;
  currentLogId: string | null = null;

  logForm = this.fb.nonNullable.group({
    version_major: [0, [Validators.required, Validators.min(0)]],
    version_minor: [0, [Validators.required, Validators.min(0)]],
    version_patch: [0, [Validators.required, Validators.min(0)]],
    category_id: ['', Validators.required],
    log_user: ['', Validators.required],
    log_message: ['', Validators.required],
    remarks: this.fb.control<string | null>(null),
    status: [1, Validators.required],
    version_date: ['', Validators.required],
  });

  ngOnInit(): void {
    this.appCategoryService.fetchAllCategories();

    this.currentLogId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.currentLogId;

    if (this.isEditMode && this.currentLogId) {
      this.loadLogData(this.currentLogId);
    }
  }

  async loadLogData(id: string): Promise<void> {
    const logData = await this.appLogService.fetchLogById(id);
    if (logData) {
      this.logForm.patchValue({
        version_major: logData.version_major,
        version_minor: logData.version_minor,
        version_patch: logData.version_patch,
        category_id: logData.category_id,
        log_user: logData.log_user,
        log_message: logData.log_message,
        remarks: logData.remarks,
        status: logData.status,
        version_date: logData.version_date,
      });
    } else {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.logForm.invalid) {
      this.logForm.markAllAsTouched();
      return;
    }

    const formValue = this.logForm.getRawValue();

    const payload: Partial<AppLog> = {
      ...formValue,
      ...(this.isEditMode && this.currentLogId
        ? { tb_tyapp_ap_lg_id: this.currentLogId }
        : {}),
    };

    const success = await this.appLogService.saveLog(payload);

    if (success) {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }
}
