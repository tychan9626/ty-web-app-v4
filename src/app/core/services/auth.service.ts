import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { TyappUser } from '../../features/user/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase = inject(SupabaseService).client;
  private router = inject(Router);

  userProfile = signal<TyappUser | null>(null);

  async init(): Promise<void> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    if (session?.user) {
      await this.fetchProfile(session.user.id);
    }

    this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await this.fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        this.userProfile.set(null);
        this.router.navigate(['/login']);
      }
    });
  }

  isSuperAdmin = computed(() => (this.userProfile()?.role ?? 0) >= 998);
  isAdmin = computed(() => (this.userProfile()?.role ?? 0) >= 900);

  private async fetchProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('tyapp_user')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (!error && data) {
      this.userProfile.set(data as TyappUser);
    }
  }

  async login(email: string, pass: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    if (data.user) {
      await this.fetchProfile(data.user.id);
      await this.router.navigate(['/welcome']);
    }
  }

  async logout() {
    await this.supabase.auth.signOut();
  }
}
