import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { APP_CONFIG } from '../../app.constants';
import { AuthService } from '../../core/services/auth.service';
import { AuthError } from '@supabase/supabase-js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly snack = inject(MatSnackBar);

  readonly appName = signal(APP_CONFIG.appName);
  readonly hidePassword = signal(true);
  readonly isLoading = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePasswordVisibility(event: MouseEvent) {
    event.preventDefault();
    this.hidePassword.update(v => !v);
  }

  async onSubmit() {
    if (this.loginForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);

    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.authService.login(email, password);
    } catch (e: unknown) {
      const message = (e as AuthError).message || 'Authentication failed';
      this.snack.open(message, 'OK', { 
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    } finally {
      this.isLoading.set(false);
    }
  }
}