import { Injectable, NgZone, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);
  private zone = inject(NgZone);

  handleError(title: string, error: unknown) {
    this.zone.run(() => {
      let errorMessage = '發生未知的錯誤';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error
      ) {
        errorMessage = String((error as { message: unknown }).message);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      this.snackBar.open(`${title}: ${errorMessage}`, '關閉', {
        panelClass: ['error-snackbar'],
        duration: 5000,
      });
    });
  }

  showSuccess(message: string) {
    this.zone.run(() => {
      this.snackBar.open(message, 'OK', {
        duration: 3000,
      });
    });
  }
}
