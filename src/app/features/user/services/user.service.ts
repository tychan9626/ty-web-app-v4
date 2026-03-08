import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { TyappUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private supabase = inject(SupabaseService).client;
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  users = signal<TyappUser[]>([]);
  loading = signal(false);

  private initialized = false;

  async fetchAllUsers(forceRefresh = false) {
    if (this.loading() || (this.initialized && !forceRefresh)) return;

    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('tyapp_user')
        .select('*')
        .order('tb_tyapp_pofl_seq_no', { ascending: true });

      if (error) throw error;
      this.users.set(data || []);
      this.initialized = true;
    } catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  this.showError('Fetch Failed', errorMessage);
} finally {
      this.loading.set(false);
    }
  }

  async updateUser(
    userId: string,
    updates: Partial<TyappUser>,
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('tyapp_user')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.showError('Update Failed', error.message);
      return false;
    }

    const updatedUser = data as TyappUser;
    if (!updatedUser) return false;

    this.users.update((list) =>
      list.map((u) => (u.user_id === userId ? updatedUser : u)),
    );

    if (userId === this.authService.userProfile()?.user_id) {
      this.authService.updateLocalProfile(updatedUser);
    }

    this.snackBar.open('Updated successfully', 'OK', { duration: 3000 });
    return true;
  }

  private showError(title: string, message: string) {
    this.snackBar.open(`${title}: ${message}`, 'Close', {
      panelClass: ['error-snackbar'],
      duration: 5000,
    });
  }
}
