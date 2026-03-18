import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
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

import { CategoryService } from '../../services/category.service';
import { AppCategory } from '../../models/category.model';
import {
  HeaderService,
  HeaderAction,
} from '../../../../../core/services/header.service';

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
  ],
  templateUrl: './category-edit.html',
  styleUrl: './category-edit.scss',
})
export class CategoryEdit implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private zone = inject(NgZone);
  public categoryService = inject(CategoryService);
  private headerService = inject(HeaderService);

  item = signal<Partial<AppCategory> | null>(null);
  currentId: string | null = null;
  isSyncing = signal(false);

  async ngOnInit() {
    this.currentId = this.route.snapshot.paramMap.get('id');

    const isSaveDisabled = () => 
      this.categoryService.loading() || !this.item()?.display_name;

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
      label: this.currentId ? 'Save Changes' : 'Create Category',
      icon: 'check',
      type: 'primary',
      disabled: isSaveDisabled,
      onClick: () => this.onSave(),
    });

    this.headerService.setConfig({
      backLink: '/development/category/list',
      showSyncStatus: !!this.currentId,
      isSyncing: this.isSyncing,
      actions: actions,
    });

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
    if (!data || !data.display_name?.trim()) return;

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
