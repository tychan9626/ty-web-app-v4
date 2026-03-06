import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { APP_CONFIG } from '../../app.constants';
import { AuthService } from '../../core/services/auth.service';

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
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snack = inject(MatSnackBar);

  appName = signal(APP_CONFIG.appName);
  hidePassword = signal(true);
  isLoading = signal(false);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePasswordVisibility(event: MouseEvent) {
    event.preventDefault();
    this.hidePassword.update(v => !v);
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);

    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.authService.login(email, password);
    } catch (e: any) {
      this.snack.open(e.message, 'OK', { duration: 5000 });
    } finally {
      this.isLoading.set(false);
    }
  }
}