import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { APP_CONFIG } from '../../app.constants';

@Component({
  selector: 'app-welcome',
  imports: [DatePipe],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
})
export class Welcome {
appName = APP_CONFIG.appName;
  appVersion = `${APP_CONFIG.version.major}.${APP_CONFIG.version.minor}.${APP_CONFIG.version.patch}`;
  versionDate = APP_CONFIG.versionDate;
  currentDate = new Date();
}
