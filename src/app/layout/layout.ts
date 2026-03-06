import { Component, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { DisplayNamePipe } from "../core/pipes/display-name.pipe";
import { RoleLabelPipe } from "../core/pipes/role-label.pipe";

@Component({
  selector: 'app-layout',
  standalone: true,
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatMenuModule,
    MatDividerModule,
    RouterModule,
    DisplayNamePipe,
    RoleLabelPipe
],
})
export class Layout {
  private breakpointObserver = inject(BreakpointObserver);
  private authService = inject(AuthService);

  isHandset = toSignal(
    this.breakpointObserver
      .observe(Breakpoints.Handset)
      .pipe(map((result) => result.matches)),
    { initialValue: false }
  );

  userProfile = this.authService.userProfile;
  isAdmin = this.authService.isAdmin;

  async onSignOut() {
    await this.authService.logout();
  }
}