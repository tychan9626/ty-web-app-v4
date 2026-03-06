import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { TyappUser } from '../models/user.model';

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

  displayName = computed(() => {
    const user = this.userProfile();
    if (!user) return 'Unknown User';
    const {
      name_display_mode,
      legal_first_name,
      legal_middle_name,
      legal_last_name,
      preferred_first_name,
      customized_display_name,
      user_id,
    } = user;
    const buildName = (...parts: (string | null)[]) =>
      parts.filter((p) => !!p).join(' ');
    let name = '';
    switch (name_display_mode) {
      case 1:
        name = buildName(legal_first_name, legal_middle_name, legal_last_name);
        break;
      case 2:
        name = buildName(legal_last_name, legal_middle_name, legal_first_name);
        break;
      case 3:
        name = buildName(
          preferred_first_name,
          legal_middle_name,
          legal_last_name,
        );
        break;
      case 4:
        name = buildName(
          legal_last_name,
          legal_middle_name,
          preferred_first_name,
        );
        break;
      case 5:
        name = customized_display_name || '';
        break;
      default:
        name = customized_display_name || '';
    }
    return name || user_id || 'Unknown User';
  });

  displayRole = computed(() => {
    const user = this.userProfile();
    if (!user) return 'Guest';
    const role = user.role;
    if (role >= 998) return 'Super Admin';
    if (role >= 900) return 'Admin';
    return 'User';
  });

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
