import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tyRoleLabel',
  standalone: true,
})
export class RoleLabelPipe implements PipeTransform {
  transform(role: number | undefined | null): string {
    if (role === undefined || role === null) return 'Guest';

    if (role >= 998) return 'Super Administrator';
    if (role >= 900) return 'Administrator';
    if (role >= 1) return 'User';

    return 'Unknown';
  }
}
