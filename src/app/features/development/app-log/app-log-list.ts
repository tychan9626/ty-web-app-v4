import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AppLogService } from './app-log.service';

@Component({
  selector: 'app-app-log-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app-log-list.html',
})
export class AppLogList implements OnInit {
  appLogService = inject(AppLogService);
  private router = inject(Router);

  ngOnInit(): void {
    this.appLogService.fetchAllLogs();
  }

  onEdit(id: string): void {
    this.router.navigate(['/development/app-log/edit', id]);
  }

  async onDelete(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this log entry?')) {
      await this.appLogService.deleteLog(id);
    }
  }
}
