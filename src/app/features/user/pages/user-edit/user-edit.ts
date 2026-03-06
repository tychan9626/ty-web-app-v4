import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { UserService } from '../../services/user.service';
import { TyappUser } from '../../models/user.model';
import { DisplayNamePipe } from '../../../../core/pipes/display-name.pipe';
import { RoleLabelPipe } from '../../../../core/pipes/role-label.pipe';
import { DisplayNameModePipe } from '../../../../core/pipes/display-name-mode.pipe';

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
    DisplayNamePipe,
    RoleLabelPipe,
    DisplayNameModePipe,
  ],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.scss',
})
export class UserEdit implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);

  readonly availableRoles = [1, 900, 998];
  readonly availableModes = [1, 2, 3, 4, 5];

  user = signal<TyappUser | null>(null);
  isSaving = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const found = this.userService.users().find((u) => u.user_id === id);
      if (found) {
        this.user.set({ ...found });
      } else {
        this.router.navigate(['/users/list']);
      }
    }
  }

  async onSave() {
    const data = this.user();
    if (!data) return;

    this.isSaving.set(true);
    const success = await this.userService.updateUser(data.user_id, data);
    if (success) {
      this.router.navigate(['/users/list']);
    }
    this.isSaving.set(false);
  }
}
