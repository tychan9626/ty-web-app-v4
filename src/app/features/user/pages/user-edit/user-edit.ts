import {
  Component,
  inject,
  OnDestroy,
  OnInit,
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
import { MatMenuModule } from '@angular/material/menu';

import { UserService } from '../../services/user.service';
import { TyappUser } from '../../models/user.model';
import { DisplayNamePipe } from '../../../../core/pipes/display-name.pipe';
import { RoleLabelPipe } from '../../../../core/pipes/role-label.pipe';
import { DisplayNameModePipe } from '../../../../core/pipes/display-name-mode.pipe';
import { HeaderService } from '../../../../core/services/header.service';
import { exportToCsv } from '../../../../core/utils/csv-export.util';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatProgressSpinnerModule,
  ],
  providers: [DisplayNamePipe, RoleLabelPipe, DisplayNameModePipe],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.scss',
})
export class UserEdit implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public userService = inject(UserService);
  private headerService = inject(HeaderService);
  private zone = inject(NgZone);

  private displayNamePipe = inject(DisplayNamePipe);
  private roleLabelPipe = inject(RoleLabelPipe);
  private displayNameModePipe = inject(DisplayNameModePipe);

  @ViewChild('editActions', { static: true })
  editActions!: TemplateRef<unknown>;

  readonly availableRoles = [1, 900, 998];
  readonly availableModes = [1, 2, 3, 4, 5];

  user = signal<TyappUser | null>(null);
  isSaving = signal(false);
  isSyncing = signal(false);

  async ngOnInit() {
    this.headerService.portal.set(this.editActions);

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isSyncing.set(true);

    const cachedUser = this.userService.users().find((u) => u.user_id === id);
    if (cachedUser) {
      this.user.set(structuredClone(cachedUser));
    }

    const freshUser = await this.userService.fetchUserById(id);

    this.zone.run(() => {
      if (freshUser) {
        this.user.set(structuredClone(freshUser));
      } else if (!cachedUser) {
        this.router.navigate(['/users/list']);
      }

      this.isSyncing.set(false);
    });
  }

  onExport() {
    const u = this.user();
    if (!u) return;

    const headers = [
      'User ID',
      'Legal First Name',
      'Preferred Name',
      'Legal Middle Name',
      'Legal Last Name',
      'Display Mode',
      'Customized Display Name',
      'Final Display Name (Preview)',
      'Assigned Role',
      'Status',
      'Internal Remarks',
    ];

    const rows = [
      [
        u.user_id,
        u.legal_first_name || '',
        u.preferred_first_name || '',
        u.legal_middle_name || '',
        u.legal_last_name || '',
        this.displayNameModePipe.transform(u.name_display_mode),
        u.customized_display_name || '',
        this.displayNamePipe.transform(u),
        this.roleLabelPipe.transform(u.role),
        u.status === 1 ? 'Active' : 'Inactive',
        u.remarks || '',
      ],
    ];

    const fileName = `User_Detail_${u.legal_first_name || u.user_id}`;
    exportToCsv(fileName, headers, rows);
  }

  async onSave() {
    const data = this.user();
    if (!data || this.isSaving()) return;

    this.isSaving.set(true);
    const success = await this.userService.updateUser(data.user_id, data);

    this.zone.run(() => {
      if (success) {
        this.router.navigate(['/users/list']);
      }
      this.isSaving.set(false);
    });
  }

  ngOnDestroy() {
    this.headerService.clear();
  }
}
