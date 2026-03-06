import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tyDisplayNameMode',
  standalone: true
})
export class DisplayNameModePipe implements PipeTransform {
  transform(mode: number): string {
    const modes: { [key: number]: string } = {
      1: 'Legal Name (First Middle Last)',
      2: 'Legal Name (Last Middle First)',
      3: 'Preferred Name (First Middle Last)',
      4: 'Preferred Name (Last Middle First)',
      5: 'Customized Only'
    };
    return modes[mode] || `Unknown Mode (${mode})`;
  }
}