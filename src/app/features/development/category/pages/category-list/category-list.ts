import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  styleUrl: './category-list.scss',
})
export class CategoryList implements OnInit, OnDestroy {
  public readonly categoryService = inject(CategoryService);
  private readonly headerService = inject(HeaderService);

  @ViewChild('navActions', { static: true }) navActions!: TemplateRef<unknown>;

  ngOnInit() {
    this.headerService.portal.set(this.navActions);
    this.categoryService.fetchAllCategories();
  }

  ngOnDestroy() {
    this.headerService.clear();
  }

  async onRefresh() {
    await this.categoryService.fetchAllCategories(true);
  }
}
