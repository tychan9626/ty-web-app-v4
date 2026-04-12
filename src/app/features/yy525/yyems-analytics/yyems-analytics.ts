import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
  untracked,
} from '@angular/core';
import {
  CommonModule,
  CurrencyPipe,
  DecimalPipe,
  UpperCasePipe,
} from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';

import { Yy525DataService } from '../yy525-data.service';
import { YyemsRecord } from '../yy525.model';

@Component({
  selector: 'app-yyems-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
  ],
  templateUrl: './yyems-analytics.html',
  styleUrl: './yyems-analytics.scss',
})
export class YyemsAnalytics implements OnInit {
  yy525Data = inject(Yy525DataService);

  selectedUser = signal<'cty' | 'frd'>('cty');
  selectedMonth = signal<string>('');
  selectedCurrency = signal<string>('');

  constructor() {
    effect(() => {
      const currencies = this.availableCurrencies();
      const current = untracked(this.selectedCurrency);
      if (currencies.length > 0 && !current) {
        this.selectedCurrency.set(
          currencies.includes('CAD') ? 'CAD' : currencies[0],
        );
      }
    });

    effect(() => {
      const months = this.availableMonths();
      const current = untracked(this.selectedMonth);
      if (months.length > 0 && !current) {
        this.selectedMonth.set(months[0]);
      }
    });
  }

  availableCurrencies = computed(() => {
    return Array.from(
      new Set(this.yy525Data.analyticsRecords().map((r) => r.currency)),
    ).filter(Boolean);
  });

  availableMonths = computed(() => {
    const months = new Set<string>();
    this.yy525Data.analyticsRecords().forEach((r) => {
      months.add(
        `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`,
      );
    });
    return Array.from(months).sort().reverse();
  });

  monthlyRealRecords = computed(() => {
    const month = this.selectedMonth();
    const currency = this.selectedCurrency();
    if (!month || !currency) return [];

    return this.yy525Data.analyticsRecords().filter((r) => {
      const m = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
      return m === month && r.currency === currency && !r.isTransfer;
    });
  });

  private getUserShare(record: YyemsRecord, user: string): number {
    const amt = record.amount;
    if (record.owner === 'yyems') return amt / 2;
    return record.owner === user ? amt : 0;
  }

  summary = computed(() => {
    const user = this.selectedUser();
    let totalIn = 0;
    let totalOut = 0;

    this.monthlyRealRecords().forEach((r) => {
      const share = this.getUserShare(r, user);
      if (share !== 0) {
        if (r.type === 'In') totalIn += share;
        if (r.type === 'Out') totalOut += share;
      }
    });

    return { totalIn, totalOut, net: totalIn - totalOut };
  });

  private buildBreakdown(type: 'In' | 'Out') {
    const user = this.selectedUser();
    const catMap = new Map<string, { totalShare: number; bills: any[] }>();

    this.monthlyRealRecords()
      .filter((r) => r.type === type)
      .forEach((r) => {
        const share = this.getUserShare(r, user);

        if (share !== 0) {
          const cat = r.category || '未分類';
          if (!catMap.has(cat)) catMap.set(cat, { totalShare: 0, bills: [] });

          const entry = catMap.get(cat)!;
          entry.totalShare += share;
          entry.bills.push({
            ...r,
            originalAmount: r.amount,
            userShare: share,
          });
        }
      });

    return Array.from(catMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => {
        return b.totalShare - a.totalShare;
      });
  }

  expenseBreakdown = computed(() => this.buildBreakdown('Out'));
  incomeBreakdown = computed(() => this.buildBreakdown('In'));

  ngOnInit(): void {
    this.yy525Data.fetchAllData();
  }
}
