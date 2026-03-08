import { Injectable, NgZone, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private readonly zone = inject(NgZone);
  
  public readonly client: SupabaseClient = this.zone.runOutsideAngular(() => 
    createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'jaxfr-v1-storage',
          detectSessionInUrl: false,
          lock: async (_, __, callback) => await callback(),
        }
      }
    )
  );
}