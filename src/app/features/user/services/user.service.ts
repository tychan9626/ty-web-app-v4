import { Injectable, inject, signal } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AuthService } from "../../../core/services/auth.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TyappUser } from "../models/user.model";

@Injectable({ providedIn: 'root' })
export class UserService {
  private supabase = inject(SupabaseService).client;
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  users = signal<TyappUser[]>([]);
  loading = signal(false);

  async fetchAllUsers() {
    this.loading.set(true);
    const { data, error } = await this.supabase
      .from('tyapp_user')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.showError('Fetch Failed', error.message);
    } else if (data) {
      this.users.set(data as TyappUser[]);
    }
    this.loading.set(false);
  }

  async updateUser(userId: string, updates: Partial<TyappUser>) {
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

    if (data) {
      const updatedUser = data as TyappUser;

      // 1. 更新管理清單中的 Signal
      this.users.update(list => list.map(u => u.user_id === userId ? updatedUser : u));

      // 2. 【核心修正】：如果改的是自己，同步更新 AuthService 的 profile
      // 這樣 Navbar (Layout) 就會即時變動
      if (userId === this.authService.userProfile()?.user_id) {
        this.authService.userProfile.set(updatedUser);
      }

      this.snackBar.open('Profile updated successfully', 'OK', { duration: 3000 });
      return true;
    }
    return false;
  }

  private showError(title: string, message: string) {
    this.snackBar.open(`${title}: ${message}`, 'Close', {
      panelClass: ['error-snackbar'], // 可在 global css 自訂樣式
      duration: 5000
    });
  }
}