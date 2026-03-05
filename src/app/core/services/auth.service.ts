import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { TyappUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService).client;
  private router = inject(Router);
  
  userProfile = signal<TyappUser | null>(null);

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
      user_id
    } = user;

    const buildName = (...parts: (string | null)[]) => parts.filter(p => !!p).join(' ');

    let name = '';

    switch (name_display_mode) {
      case 1:
        name = buildName(legal_first_name, legal_middle_name, legal_last_name);
        break;
      case 2:
        name = buildName(legal_last_name, legal_middle_name, legal_first_name);
        break;
      case 3:
        name = buildName(preferred_first_name, legal_middle_name, legal_last_name);
        break;
      case 4:
        name = buildName(legal_last_name, legal_middle_name, preferred_first_name);
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

  async login(email: string, pass: string) {
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (authError) throw authError;

    const { data: profileData, error: profileError } = await this.supabase
      .from('tyapp_user')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    this.userProfile.set(profileData as TyappUser);
    this.router.navigate(['/welcome']);
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.userProfile.set(null);
    this.router.navigate(['/login']);
  }
}