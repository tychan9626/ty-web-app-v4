import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { UserService } from '../../services/user.service';
import { TyappUser } from '../../models/user.model';
import { DisplayNamePipe } from '../../../../core/pipes/display-name.pipe';
import { RoleLabelPipe } from '../../../../core/pipes/role-label.pipe';
import { DisplayNameModePipe } from '../../../../core/pipes/display-name-mode.pipe';
import { HeaderService } from '../../../../core/services/header.service';
import { exportToCsv } from '../../../../core/utils/csv-export.util';

@Component({
  selector: 'app-user-edit',
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
    MatMenuModule,
    DisplayNamePipe,
    RoleLabelPipe,
    DisplayNameModePipe,
  ],
  providers: [DisplayNamePipe, RoleLabelPipe],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.scss',
})
export class UserEdit implements OnInit, OnDestroy {
private route = inject(ActivatedRoute);
  private router = inject(Router);
  public userService = inject(UserService);
  private headerService = inject(HeaderService);
  
  // 注入 Pipe 供邏輯使用
  private displayNamePipe = inject(DisplayNamePipe);
  private roleLabelPipe = inject(RoleLabelPipe);

  // 嚴格型別：使用 unknown 取代 any
  @ViewChild('editActions', { static: true }) editActions!: TemplateRef<unknown>;

  readonly availableRoles = [1, 900, 998];
  readonly availableModes = [1, 2, 3, 4, 5];

  user = signal<TyappUser | null>(null);
  isSaving = signal(false);

  async ngOnInit() {
    // 1. 優先掛載頂端動作條
    this.headerService.portal.set(this.editActions);

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    // 2. 獲取數據 (支援 F5 刷新)
    await this.userService.fetchAllUsers();
    const found = this.userService.users().find((u) => u.user_id === id);

    if (found) {
      this.user.set(structuredClone(found));
    } else {
      this.router.navigate(['/users/list']);
    }
  }

  onExport() {
    const u = this.user();
    if (!u) return;

    const headers = ['ID', 'Name', 'Role'];
    const rows = [
      [
        u.user_id,
        this.displayNamePipe.transform(u),
        this.roleLabelPipe.transform(u.role),
      ],
    ];

    exportToCsv('User Detail', headers, rows);
  }

  async onSave() {
    const data = this.user();
    if (!data || this.isSaving()) return;

    this.isSaving.set(true);
    const success = await this.userService.updateUser(data.user_id, data);
    if (success) {
      this.router.navigate(['/users/list']);
    }
    this.isSaving.set(false);
  }

ngOnDestroy() {
    this.headerService.clear();
  }
}
