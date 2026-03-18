import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CategoryService } from '../../services/category.service';
import { HeaderService } from '../../../../../core/services/header.service';

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
}
