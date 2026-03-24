export interface AppLog {
  tb_tyapp_ap_lg_id: string;
  tb_tyapp_ap_lg_seq_no: number;
  version_major: number;
  version_minor: number;
  version_patch: number;
  category_id: string;
  log_user: string;
  log_message: string;
  remarks: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  version_date: string;
  deleted_at: string | null;
}

export type AppLogPayload = Omit<
  AppLog,
  'tb_tyapp_ap_lg_seq_no' | 'created_at' | 'updated_at' | 'deleted_at'
>;
