import { Injectable, NgZone, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private zone = inject(NgZone);
  private instance?: SupabaseClient;

  get client(): SupabaseClient {
    if (this.instance) return this.instance;

    this.instance = this.zone.runOutsideAngular(() =>
      createClient(
        environment.supabaseUrl,
        environment.supabaseKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            storageKey: 'jaxfr-v1-storage',
            detectSessionInUrl: false,
            lock: async (name, timeout, callback) => {
              return await callback();
            }
          }
        }
      )
    );

    return this.instance;
  }
}