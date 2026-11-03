/**
 * Parses date string in "DD/MM/YYYY" format into a Date object.
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start && !end) return startDate || endDate || '';
  if (!start && end) return end.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  if (start && !end) return start.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });

  const startDay = start!.getDate();
  const endDay = end!.getDate();
  const startMonth = start!.toLocaleDateString('it-IT', { month: 'short' });
  const endMonth = end!.toLocaleDateString('it-IT', { month: 'short' });
  const year = end!.getFullYear();

  if (start!.getMonth() === end!.getMonth()) {
    return `${startDay} - ${endDay} ${endMonth} ${year}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
}

export function isEventOngoing(startDate: string, endDate: string): boolean {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return false;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return today >= start && today <= end;
}

export function isEventFuture(startDate: string): boolean {
  const start = parseDate(startDate);
  if (!start) return false;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setHours(0, 0, 0, 0);
  
  return start > today;
}

export function isEventPast(endDate: string): boolean {
  const end = parseDate(endDate);
  if (!end) return false;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  end.setHours(23, 59, 59, 999);
  
  return end < today;
}

export interface DayTab {
  dayNumber: number; // 1-based index (1, 2, 3...)
  date: Date;
  label: string;      // e.g. "Mon 07" or "TODAY"
  isToday: boolean;
}

export function getDatesBetween(startDate: string, endDate: string): DayTab[] {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return [];

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  const tabs: DayTab[] = [];
  let current = new Date(start.getTime());
  let dayNumber = 1;

  while (current <= end) {
    const curDateStr = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
    const isToday = curDateStr === todayStr;
    const weekday = current.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase();
    const dayOfMonth = current.getDate().toString().padStart(2, '0');

    tabs.push({
      dayNumber,
      date: new Date(current.getTime()),
      label: isToday ? 'OGGI' : `${weekday} ${dayOfMonth}`,
      isToday,
    });

    current.setDate(current.getDate() + 1);
    dayNumber++;
  }

  return tabs;
}

export function getLocalUtcOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}
