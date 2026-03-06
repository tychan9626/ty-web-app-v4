import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UserService } from '../../services/user.service';
import { DisplayNamePipe } from '../../../../core/pipes/display-name.pipe';
import { RoleLabelPipe } from '../../../../core/pipes/role-label.pipe';
import { TyappUser } from '../../models/user.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    DisplayNamePipe,
    RoleLabelPipe,
    RouterModule,
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList implements OnInit {
  userService = inject(UserService);

  isDrawerOpen = signal(false);
  isSaving = signal(false);
  selectedUser = signal<TyappUser | null>(null);

  displayedColumns: string[] = ['name', 'role', 'actions'];

  ngOnInit() {
    this.userService.fetchAllUsers();
  }

  onEdit(user: TyappUser) {
    this.selectedUser.set({ ...user });
    this.isDrawerOpen.set(true);
  }

  async onSave() {
    const user = this.selectedUser();
    if (!user) return;

    this.isSaving.set(true);
    const success = await this.userService.updateUser(user.user_id, {
      legal_first_name: user.legal_first_name,
      legal_last_name: user.legal_last_name,
      preferred_first_name: user.preferred_first_name,
      name_display_mode: user.name_display_mode,
      customized_display_name: user.customized_display_name,
      role: user.role,
    });

    if (success) {
      this.isDrawerOpen.set(false);
    }
    this.isSaving.set(false);
  }
}
