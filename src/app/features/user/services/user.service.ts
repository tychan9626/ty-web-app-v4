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

  async fetchAllUsers(forceRefresh = false) {
    if (this.loading() || (this.initialized && !forceRefresh)) return;

    // 開始載入 (這在事件觸發當下，通常沒問題)
    this.loading.set(true);
    
    try {
      const { data, error } = await this.supabase
        .from('tyapp_user')
        .select('*')
        .order('tb_tyapp_pofl_seq_no', { ascending: true });

      if (error) throw error;

      // 3. 關鍵修復：強制在 Angular Zone 內更新狀態
      this.zone.run(() => {
        this.users.set(data || []);
        this.initialized = true;
        this.loading.set(false); // 確保轉圈圈會停下
      });

    } catch (error) {
      this.zone.run(() => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.showError('Fetch Failed', errorMessage);
        this.loading.set(false); // 發生錯誤也要停止轉圈圈
      });
    } 
    // 注意：這裡我們移除了 finally 區塊，因為已經在 zone.run 裡面處理掉 loading.set(false) 了
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
