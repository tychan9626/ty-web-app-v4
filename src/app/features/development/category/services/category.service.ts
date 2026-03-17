import { Injectable, NgZone, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { AppCategory } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private supabase = inject(SupabaseService).client;
  private snackBar = inject(MatSnackBar);
  private zone = inject(NgZone);

  categories = signal<AppCategory[]>([]);
  loading = signal(false);

  async fetchAllCategories(force = false) {
    if (this.categories().length > 0 && !force) return;

    this.loading.set(true);
    const { data, error } = await this.supabase
      .from('tyapp_app_category')
      .select('*')
      .is('deleted_at', null)
      .order('tb_tyapp_ap_ctgy_seq_no', { ascending: true });

    this.zone.run(() => {
      if (error) {
        this.snackBar.open(error.message, 'OK');
      } else {
        this.categories.set(data || []);
      }
      this.loading.set(false);
    });
  }

  async saveCategory(category: Partial<AppCategory>): Promise<boolean> {
    const isNew = !category.tb_tyapp_ap_ctgy_id;

    const {
      tb_tyapp_ap_ctgy_seq_no,
      created_at,
      updated_at,
      deleted_at,
      ...payload
    } = category;

    this.loading.set(true);

    const query = isNew
      ? this.supabase
          .from('tyapp_app_category')
          .insert(payload)
          .select()
          .single()
      : this.supabase
          .from('tyapp_app_category')
          .update(payload)
          .eq('tb_tyapp_ap_ctgy_id', category.tb_tyapp_ap_ctgy_id)
          .select()
          .single();

    const { data, error } = await query;

    return this.zone.run(() => {
      this.loading.set(false);
      if (error) {
        this.snackBar.open(error.message, 'OK');
        return false;
      }

      const saved = data as AppCategory;
      this.categories.update((list) =>
        isNew
          ? [...list, saved]
          : list.map((item) =>
              item.tb_tyapp_ap_ctgy_id === saved.tb_tyapp_ap_ctgy_id
                ? saved
                : item,
            ),
      );
      this.snackBar.open('Saved successfully', 'OK', { duration: 2000 });
      return true;
    });
  }

  async deleteCategory(id: string): Promise<boolean> {
    const { error } = await this.supabase.rpc(
      'tyapp_app_category_soft_delete_single_record',
      {
        record_id: id,
      },
    );

    return this.zone.run(() => {
      if (error) {
        this.snackBar.open(`Delete Failed: ${error.message}`, 'OK');
        return false;
      }
      this.categories.update((list) =>
        list.filter((item) => item.tb_tyapp_ap_ctgy_id !== id),
      );
      this.snackBar.open('Category deleted', 'OK', { duration: 2000 });
      return true;
    });
  }
}
