import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

import { HeaderService } from '../../core/services/header.service';
import { UserService } from '../user/user.service';
import { ArticleService } from './article.service';
import { DisplayNamePipe } from '../../core/pipes/display-name.pipe';
import { exportToCsv } from '../../core/utils/csv-export.util';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [DisplayNamePipe],
  templateUrl: './article-list.html',
})
export class ArticleList implements OnInit, OnDestroy {
  public articleService = inject(ArticleService);
  public userService = inject(UserService);

  private headerService = inject(HeaderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private displayNamePipe = inject(DisplayNamePipe);

  listVM = computed(() => {
    const articles = this.articleService.articles();
    const users = this.userService.users();

    return articles.map((article) => {
      const user = users.find((u) => u.user_id === article.manage_user_id);
      return {
        ...article,
        manageUserName: user
          ? this.displayNamePipe.transform(user)
          : 'Unknown User',
      };
    });
  });

  ngOnInit() {
    const isLoading = computed(
      () => this.articleService.loading() || this.userService.loading(),
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
          label: 'New Article',
          icon: 'add',
          type: 'primary',
          disabled: isLoading,
          onClick: () =>
            this.router.navigate(['../new'], { relativeTo: this.route }),
        },
      ],
    });

    this.articleService.fetchAllArticles();
    this.userService.fetchAllUsers();
  }

  async onRefresh() {
    await this.articleService.fetchAllArticles(true);
    await this.userService.fetchAllUsers(true);
  }

  onExport() {
    const articles = this.listVM();
    if (!articles.length) return;

    const headers = [
      'Title',
      'Platform',
      'Author',
      'Publish Date',
      'Manage User',
      'Status',
    ];
    const rows: string[][] = articles.map((a) => [
      a.title || '',
      a.platform || '',
      a.author || '',
      a.publish_date || '',
      a.manageUserName,
      a.status === 1 ? 'Published' : 'Draft',
    ]);

    exportToCsv(
      `Articles_${new Date().toISOString().split('T')[0]}`,
      headers,
      rows,
    );
  }

  ngOnDestroy() {
    this.headerService.clear();
  }
}
