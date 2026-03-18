import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  TemplateRef,
  ViewChild,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CategoryService } from '../../services/category.service';
import { AppCategory } from '../../models/category.model';
import { HeaderService } from '../../../../../core/services/header.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-category-edit',
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
    MatProgressSpinnerModule,
  ],
  templateUrl: './category-edit.html',
  styleUrl: './category-edit.scss',
})
export class CategoryEdit implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private zone = inject(NgZone);
  private snackBar = inject(MatSnackBar);
  public categoryService = inject(CategoryService);
  private headerService = inject(HeaderService);

  @ViewChild('editActions', { static: true })
  editActions!: TemplateRef<unknown>;

  item = signal<Partial<AppCategory> | null>(null);
  currentId: string | null = null;

  isSyncing = signal(false);

  async ngOnInit() {
    this.headerService.portal.set(this.editActions);

    this.currentId = this.route.snapshot.paramMap.get('id');

    if (this.currentId) {
      this.isSyncing.set(true);

      const cachedCat = this.categoryService
        .categories()
        .find((c) => c.tb_tyapp_ap_ctgy_id === this.currentId);
      if (cachedCat) {
        this.item.set(structuredClone(cachedCat));
      }

      const freshCat = await this.categoryService.fetchCategoryById(
        this.currentId,
      );

      this.zone.run(() => {
        if (freshCat) {
          this.item.set(structuredClone(freshCat));
        } else if (!cachedCat) {
          this.router.navigate(['/development/category/list']);
        }
        this.isSyncing.set(false);
      });
    } else {
      this.item.set({
        display_name: '',
        name_en: '',
        name_zh: '',
        status: 1,
        remarks: '',
      });
    }
  }

  async onSave() {
    const data = this.item();
    if (!data || !data.display_name?.trim()) {
      return;
    }

    const success = await this.categoryService.saveCategory(data);
    if (success) {
      this.router.navigate(['/development/category/list']);
    }
  }

  async onDelete() {
    if (!this.currentId) return;

    if (
      confirm(
        'Are you sure you want to delete this category? This action might be irreversible.',
      )
    ) {
      const success = await this.categoryService.deleteCategory(this.currentId);
      if (success) {
        this.router.navigate(['/development/category/list']);
      }
    }
  }

  ngOnDestroy() {
    this.headerService.clear();
  }
}
