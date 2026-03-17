import { Injectable, NgZone, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { TyappUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private supabase = inject(SupabaseService).client;
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private zone = inject(NgZone);

  users = signal<TyappUser[]>([]);
  loading = signal(false);

  private initialized = false;
  private fetchPromise: Promise<void> | null = null;

  async fetchUserById(userId: string): Promise<TyappUser | null> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('tyapp_user')
        .select('*')
        .eq('user_id', userId)
        .single();

      return this.zone.run(() => {
        this.loading.set(false);
        if (error) {
          this.showError('Fetch Error', error.message);
          return null;
        }
        return data as TyappUser;
      });
    } catch (error: any) {
      return this.zone.run(() => {
        this.loading.set(false);
        this.showError('Fetch Error', error.message || 'Unknown error');
        return null;
      });
    }
  }

  fetchAllUsers(forceRefresh = false): Promise<void> {
    if (this.initialized && !forceRefresh) return Promise.resolve();

    if (this.fetchPromise) return this.fetchPromise;

    this.loading.set(true);

    const request = (async () => {
      try {
        const { data, error } = await this.supabase
          .from('tyapp_user')
          .select('*')
          .order('tb_tyapp_pofl_seq_no', { ascending: true });

        if (error) throw error;

        this.zone.run(() => {
          this.users.set(data || []);
          this.initialized = true;
          this.loading.set(false);
        });
      } catch (error: unknown) {
        this.zone.run(() => {
          let errorMessage = 'An unexpected error occurred';

          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (
            typeof error === 'object' &&
            error !== null &&
            'message' in error
          ) {
            errorMessage = String(error.message);
          } else if (typeof error === 'string') {
            errorMessage = error;
          }

          this.showError('Fetch Failed', errorMessage);
          this.loading.set(false);
        });
      } finally {
        this.fetchPromise = null;
      }
    })();

    this.fetchPromise = request;
    return request;
  }

  async updateUser(
    userId: string,
    updates: Partial<TyappUser>,
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('tyapp_user')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      return this.zone.run(() => {
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
      });
    } catch (error: unknown) {
      return this.zone.run(() => {
        let errorMessage = 'An unexpected error occurred during update';

        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (
          typeof error === 'object' &&
          error !== null &&
          'message' in error
        ) {
          errorMessage = String(error.message);
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        this.showError('Update Error', errorMessage);
        return false;
      });
    }
  }

  private showError(title: string, message: string) {
    this.snackBar.open(`${title}: ${message}`, 'Close', {
      panelClass: ['error-snackbar'],
      duration: 5000,
    });
  }
}
