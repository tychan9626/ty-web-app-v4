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
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import {
  HeaderService,
  HeaderAction,
} from '../../core/services/header.service';
import { UserService } from '../user/user.service';
import { Article } from './article.model';
import { ArticleService } from './article.service';
import { SelectOption } from '../../core/models/common.model';
import { DisplayNamePipe } from '../../core/pipes/display-name.pipe';
import { exportToCsv } from '../../core/utils/csv-export.util';

@Component({
  selector: 'app-article-edit',
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
    MatAutocompleteModule,
  ],
  providers: [provideNativeDateAdapter(), DisplayNamePipe],
  templateUrl: './article-edit.html',
})
export class ArticleEdit implements OnInit, OnDestroy, DoCheck {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private zone = inject(NgZone);
  private headerService = inject(HeaderService);
  private displayNamePipe = inject(DisplayNamePipe);

  public articleService = inject(ArticleService);
  public userService = inject(UserService);
  public authService = inject(AuthService);

  item = signal<Partial<Article> | null>(null);
  currentId: string | null = null;
  originalDataStr = signal<string>('');

  isDirty = signal(false);
  isSaveDisabled = signal(true);

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

  syncStatus = computed<'loading' | 'up-to-date' | 'unsaved' | 'none'>(() => {
    if (this.articleService.loading()) return 'loading';
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
      const currentlyDirty = JSON.stringify(current) !== original;
      if (this.isDirty() !== currentlyDirty) {
        this.isDirty.set(currentlyDirty);
      }

      const disabled =
        this.articleService.loading() ||
        !currentlyDirty ||
        !current.title?.trim() ||
        !current.author?.trim() ||
        !current.platform?.trim() ||
        !current.content?.trim() ||
        !current.publish_date ||
        !current.manage_user_id;

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

    await Promise.all([
      this.articleService.fetchAllArticles(),
      this.userService.fetchAllUsers(),
    ]);

    const actions: HeaderAction[] = [];
    if (this.currentId) {
      actions.push({
        label: 'Export',
        icon: 'download',
        type: 'secondary',
        onClick: () => this.onExport(),
      });
      actions.push({
        label: 'Delete',
        icon: 'delete_outline',
        type: 'secondary',
        onClick: () => this.onDelete(),
      });
    }
    actions.push({
      label: this.currentId ? 'Save Changes' : 'Create Article',
      icon: 'check',
      type: 'primary',
      disabled: this.isSaveDisabled,
      onClick: () => this.onSave(),
    });

    this.headerService.setConfig({
      backLink: '/article/list',
      syncStatus: this.syncStatus,
      actions: actions,
    });

    if (this.currentId) {
      const cached = this.articleService
        .articles()
        .find((a) => a.tb_tyapp_atcl_id === this.currentId);
      if (cached) {
        this.item.set(structuredClone(cached));
        this.originalDataStr.set(JSON.stringify(cached));
        this.userSearch.set(cached.manage_user_id);
      }

      const fresh = await this.articleService.fetchArticleById(this.currentId);
      this.zone.run(() => {
        if (fresh) {
          this.item.set(structuredClone(fresh));
          this.originalDataStr.set(JSON.stringify(fresh));
          this.userSearch.set(fresh.manage_user_id);
        } else if (!cached) {
          this.router.navigate(['/article/list']);
        }
      });
    } else {
      const newArticle: Partial<Article> = {
        title: '',
        author: '',
        platform: '',
        content: '',
        url_link: '',
        remarks: '',
        publish_date: new Date() as unknown as string,
        manage_user_id: this.authService.userProfile()?.user_id || '',
        status: 1,
      };
      this.item.set(newArticle);
      this.originalDataStr.set(JSON.stringify(newArticle));
    }
  }

  async onSave() {
    const data = this.item();
    if (!data || !data.title?.trim() || !data.manage_user_id) return;

    const dateVal = data.publish_date as unknown;
    if (dateVal instanceof Date) {
      data.publish_date = new Date(
        dateVal.getTime() - dateVal.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .split('T')[0];
    }

    const success = await this.articleService.saveArticle(data);
    if (success) {
      this.originalDataStr.set(JSON.stringify(data));
      this.isDirty.set(false);
      this.router.navigate(['/article/list']);
    }
  }

  async onDelete() {
    if (!this.currentId) return;
    if (confirm('Are you sure you want to delete this article?')) {
      const success = await this.articleService.deleteArticle(this.currentId);
      if (success) {
        this.isDirty.set(false);
        this.router.navigate(['/article/list']);
      }
    }
  }

  onExport() {
    const data = this.item();
    if (!data || !this.currentId) return;

    const dateVal = data.publish_date as unknown;
    const formattedDate =
      dateVal instanceof Date
        ? dateVal.toISOString().split('T')[0]
        : String(dateVal || '');

    const headers = [
      'Article ID',
      'Title',
      'Platform',
      'Author',
      'Publish Date',
      'Manage User',
      'URL Link',
      'Content',
      'Status',
      'Remarks',
    ];
    const rows: string[][] = [
      [
        this.currentId,
        data.title || '',
        data.platform || '',
        data.author || '',
        formattedDate,
        this.displayUserName(data.manage_user_id || ''),
        data.url_link || '',
        data.content || '',
        data.status === 1 ? 'Published' : 'Draft',
        data.remarks || '',
      ],
    ];

    exportToCsv(`Article_Detail_${data.title}`, headers, rows);
  }

  ngOnDestroy() {
    this.headerService.clear();
  }
}
