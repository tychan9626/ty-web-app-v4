import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CategoryService } from '../../services/category.service';
import { HeaderService } from '../../../../../core/services/header.service';

import { exportToCsv } from '../../../../../core/utils/csv-export.util';
@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './category-list.html',
})
export class CategoryList implements OnInit, OnDestroy {
  public readonly categoryService = inject(CategoryService);
  private readonly headerService = inject(HeaderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const isLoading = computed(() => this.categoryService.loading());

    const isExportDisabled = computed(() => 
      this.categoryService.loading() || this.categoryService.categories().length === 0
    );

    this.headerService.setConfig({
      title: 'App Categories',
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
          disabled: isExportDisabled,
          onClick: () => this.onExport(),
        },
        {
          label: 'New Category',
          icon: 'add',
          type: 'primary',
          disabled: isLoading,
          onClick: () =>
            this.router.navigate(['../new'], { relativeTo: this.route }),
        },
      ],
    });

    this.categoryService.fetchAllCategories();
  }

  ngOnDestroy() {
    this.headerService.clear();
  }

  async onRefresh() {
    await this.categoryService.fetchAllCategories(true);
  }

  onExport() {
    const categories = this.categoryService.categories();
    if (categories.length === 0) return;

    const headers = ['Category ID', 'Display Name', 'English Name', 'Chinese Name', 'Status'];
    const rows = categories.map((c) => [
      c.tb_tyapp_ap_ctgy_id,
      c.display_name || '',
      c.name_en || '',
      c.name_zh || '',
      c.status === 1 ? 'Active' : 'Inactive'
    ]);

    exportToCsv('Category_List', headers, rows);
  }
}
