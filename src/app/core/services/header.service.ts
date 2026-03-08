import { Injectable, TemplateRef, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HeaderService {
  title = signal<string>('');
  
  portal = signal<TemplateRef<unknown> | null>(null);

  clear() {
    this.title.set('');
    this.portal.set(null);
  }
}