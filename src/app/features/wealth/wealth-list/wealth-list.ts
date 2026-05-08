import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';

import { WealthService } from '../wealth.service';
import { HeaderService } from '../../../core/services/header.service';
import { WealthTransaction } from '../wealth.model';
import { CurrencyZhPipe } from '../currency-zh.pipe';
import { DisplayNamePipe } from '../../../core/pipes/display-name.pipe';
import { UserService } from '../../user/user.service';

@Component({
  selector: 'app-wealth-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    CurrencyZhPipe,
    DisplayNamePipe,
    MatSlideToggleModule,
    FormsModule,
  ],
  templateUrl: './wealth-list.html',
  styleUrl: './wealth-list.scss',
})
export class WealthList implements OnInit {
  private wealthService = inject(WealthService);
  private headerService = inject(HeaderService);
  private router = inject(Router);
  public readonly userService = inject(UserService);

  transactions = this.wealthService.transactions;
  loading = this.wealthService.loading;

  showActiveOnly = signal(false);
  sortDescending = signal(true);

  filteredTransactions = computed(() => {
    const rawList = this.transactions();
    let list = [...rawList];

    // 1. Filter Active Only
    if (this.showActiveOnly()) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3);

      // 先找出哪些 Major Seq 下有 Active 的項目
      const activeMajorSeqs = new Set<number>();
      rawList.forEach((txn) => {
        if (txn.transaction_type === 'term_deposit' && !this.isExpired(txn.end_date)) {
          activeMajorSeqs.add(txn.seq_major);
        }
      });

      list = list.filter((txn) => {
        // 定存：看到期日
        if (txn.transaction_type === 'term_deposit') {
          return !this.isExpired(txn.end_date);
        }
        // 外匯：如果是 3 天內的兌換，或者同一個 Major 下有 Active 定存
        if (txn.transaction_type === 'fx_exchange') {
          const startDate = new Date(txn.start_date);
          const isRecent = startDate >= threeDaysAgo;
          const isPartOfActiveGroup = activeMajorSeqs.has(txn.seq_major);
          return isRecent || isPartOfActiveGroup;
        }
        // 活期與投資：預設保留 (因為本金依然在裡面)
        return true;
      });
    }

    // 2. Sort
    list.sort((a, b) => {
      const multiplier = this.sortDescending() ? 1 : -1;
      if (b.seq_major !== a.seq_major) {
        return (b.seq_major - a.seq_major) * multiplier;
      }
      // Minor 在 Major 確定後，始終保持升序 (X.1 -> X.2) 或跟隨 Major
      // 根據您的需求：36.2, 36.1, 35 是倒序，所以 Minor 在倒序時也要倒序
      return (b.seq_minor - a.seq_minor) * multiplier;
    });

    return list;
  });

  ngOnInit() {
    this.updateHeader();
    this.wealthService.fetchAllTransactions();
    this.userService.fetchAllUsers();
  }

  private updateHeader() {
    this.headerService.setConfig({
      title: 'Wealth Management',
      actions: [
        {
          label: '僅顯示進行中',
          type: 'toggle',
          checked: this.showActiveOnly(),
          onChange: (val) => {
            this.showActiveOnly.set(val);
            this.updateHeader();
          },
        },
        {
          label: '序號倒序',
          type: 'toggle',
          checked: this.sortDescending(),
          onChange: (val) => {
            this.sortDescending.set(val);
            this.updateHeader();
          },
        },
        {
          label: 'Add Transaction',
          icon: 'add',
          type: 'primary',
          onClick: () => this.router.navigate(['/wealth/edit']),
        },
      ],
    });
  }

  async onDelete(txn: WealthTransaction) {
    if (confirm('確定要刪除這筆紀錄嗎？')) {
      await this.wealthService.deleteTransaction(txn.tb_tyapp_fin_txn_id);
    }
  }

  getLabel(type: string): string {
    switch (type) {
      case 'term_deposit': return '定期存款';
      case 'fx_exchange': return '外匯兌換';
      case 'investment': return '投資項目';
      case 'cash_flow': return '活期變動';
      default: return type;
    }
  }

  getUserById(userId: string) {
    return this.userService.users().find((u) => u.user_id === userId);
  }

  isExpired(endDate: string | null): boolean {
    if (!endDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    return end < today;
  }
}
