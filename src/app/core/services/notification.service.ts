import { Injectable, NgZone, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);
  private zone = inject(NgZone);

  /**
   * 統一的錯誤處理與顯示
   * @param title 錯誤標題 (例如: 'Fetch Failed')
   * @param error 任何型別的錯誤物件 (Supabase error, JS Error, string 等)
   */
  handleError(title: string, error: unknown) {
    this.zone.run(() => {
      let errorMessage = 'An unexpected error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error
      ) {
        errorMessage = String((error as any).message);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      this.snackBar.open(`${title}: ${errorMessage}`, 'Close', {
        panelClass: ['error-snackbar'],
        duration: 5000,
      });
    });
  }

  /**
   * 統一的成功提示
   */
  showSuccess(message: string) {
    this.zone.run(() => {
      this.snackBar.open(message, 'OK', {
        duration: 3000,
      });
    });
  }
}
