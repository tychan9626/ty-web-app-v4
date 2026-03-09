import { Component, inject, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../core/services/auth.service';
import { HeaderService } from '../core/services/header.service';
import { DisplayNamePipe } from '../core/pipes/display-name.pipe';
import { RoleLabelPipe } from '../core/pipes/role-label.pipe';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgTemplateOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatMenuModule,
    MatDividerModule,
    DisplayNamePipe,
    RoleLabelPipe,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  @ViewChild('drawer') drawer!: MatSidenav;

  private readonly auth = inject(AuthService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  public readonly headerService = inject(HeaderService);

  readonly isHandset = toSignal(
    this.breakpointObserver
      .observe(Breakpoints.Handset)
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  readonly userProfile = this.auth.userProfile;
  readonly isAdmin = this.auth.isAdmin;

  closeOnMobile() {
    if (this.isHandset()) {
      this.drawer.close();
    }
  }

  async onSignOut() {
    await this.auth.logout();
  }
}
