export function parseLocalDate(
  dateStr: string | null | undefined,
): Date | null {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

export function formatDate(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
}

export function extractTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function buildIsoString(
  dateStr: string,
  timeStr: string,
): string | null {
  if (!timeStr || !dateStr) return null;
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

export function buildSequentialIsoStrings(
  baseDateStr: string,
  timeStrings: (string | null | undefined)[],
): (string | null)[] {
  if (!baseDateStr) return timeStrings.map(() => null);

  let currentDayOffset = 0;
  let lastValidTime: string | null = null;
  const results: (string | null)[] = [];

  const parts = baseDateStr.split('-');
  const baseDate = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),
  );

  for (const t of timeStrings) {
    if (!t) {
      results.push(null);
      continue;
    }

    if (lastValidTime !== null && t < lastValidTime) {
      currentDayOffset += 1;
    }

    const targetDate = new Date(baseDate);
    targetDate.setDate(targetDate.getDate() + currentDayOffset);

    const [hours, minutes] = t.split(':').map(Number);
    targetDate.setHours(hours, minutes, 0, 0);

    results.push(targetDate.toISOString());

    lastValidTime = t;
  }

  return results;
}

export function addMinutesToTime(timeStr: string, mins: number): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m + mins, 0, 0);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function getWeekRangeLabel(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (!d) return 'Unknown Week';

  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', opts)} - ${sunday.toLocaleDateString('en-US', opts)}, ${sunday.getFullYear()}`;
}

export function groupItemsByWeek<T>(
  items: T[],
  dateExtractor: (item: T) => string | null | undefined,
): { weekLabel: string; items: T[] }[] {
  const groups: { weekLabel: string; items: T[] }[] = [];
  let currentGroup: { weekLabel: string; items: T[] } | null = null;

  for (const item of items) {
    const label = getWeekRangeLabel(dateExtractor(item) || '');

    if (!currentGroup || currentGroup.weekLabel !== label) {
      currentGroup = { weekLabel: label, items: [] };
      groups.push(currentGroup);
    }
    currentGroup.items.push(item);
  }

  return groups;
}
