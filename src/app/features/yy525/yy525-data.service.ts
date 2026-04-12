import { Injectable, signal, NgZone, inject } from '@angular/core';
import { YyemsRaw, VendorRaw, AccountRaw, YyemsRecord } from './yy525.model';
import { YY525_SOURCE } from '../../app.constants';

@Injectable({ providedIn: 'root' })
export class Yy525DataService {
  private zone = inject(NgZone);

  private readonly GAS_URL = YY525_SOURCE.GAS_URL;
  private readonly TOKEN = YY525_SOURCE.TOKEN;

  loading = signal(false);

  fetchDurationSec = signal<number>(0);
  processDurationSec = signal<number>(0);

  analyticsRecords = signal<YyemsRecord[]>([]);

  async fetchAllData(force = false) {
    if (this.analyticsRecords().length > 0 && !force) return;

    this.loading.set(true);

    const fetchStart = performance.now();
    try {
      const response = await fetch(`${this.GAS_URL}?token=${this.TOKEN}`, {
        method: 'GET',
        redirect: 'follow',
      });
      if (!response.ok) throw new Error('連線失敗');
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const fetchEnd = performance.now();

      const processStart = performance.now();

      const vendors: VendorRaw[] = data.vendors || [];
      const accounts: AccountRaw[] = data.accounts || [];
      const yyems: YyemsRaw[] = data.yyems || [];

      const vendorMap = new Map(vendors.map((v) => [v.ID, v]));
      const accountMap = new Map(accounts.map((a) => [a.ID, a]));

      const processedRecords = yyems
        .filter((r) => r.In_or_out === 'In' || r.In_or_out === 'Out')
        .filter(
          (r) => !String(r['Vendor ID'] || '').includes('Internal_transfer'),
        )
        .map((r) => {
          const vendor = vendorMap.get(r['Vendor ID']);
          const account = accountMap.get(r['Financial_Accounts']);

          const isTransfer = String(r['Vendor ID'] || '').includes('Internal_transfer');

          return {
            id: r['YYEMS ID'],
            date: new Date(r.DateTime),
            type: r.In_or_out as 'In' | 'Out',
            amount: Number(r.Amount) || 0,
            currency: r.Currency || 'CAD',
            owner: String(r.Ownership || '')
              .toLowerCase()
              .trim(),
            walletOwner: String(r.Wallet_owner || '')
              .toLowerCase()
              .trim(),
            vendorName: vendor ? vendor.Name : '未知商家',
            category: vendor ? vendor['Vendor_分類'] : '未分類',
            accountName: account ? account['Display Name'] : '未知帳戶',
            isTransfer,
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      const processEnd = performance.now();

      this.zone.run(() => {
        this.fetchDurationSec.set((fetchEnd - fetchStart) / 1000);
        this.processDurationSec.set((processEnd - processStart) / 1000);
        this.analyticsRecords.set(processedRecords);
        this.loading.set(false);
      });
    } catch (error: unknown) {
      console.error('yy525 資料同步失敗', error);
      this.zone.run(() => this.loading.set(false));
    }
  }
}
