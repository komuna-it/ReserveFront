import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CalendarHelper {
  readonly hoursRange = Array.from({ length: 12 }, (_, i) => i + 10); // 10:00 - 21:00

  readonly weekDayLabels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
  readonly monthLabels = [
    'Styczeń',
    'Luty',
    'Marzec',
    'Kwiecień',
    'Maj',
    'Czerwiec',
    'Lipiec',
    'Sierpień',
    'Wrzesień',
    'Październik',
    'Listopad',
    'Grudzień',
  ];

  getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    d.setHours(0, 0, 0, 0);
    return new Date(d.setDate(diff));
  }

  isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  parseDurationToHours(isoDuration: string): number {
    const hoursMatch = isoDuration.match(/(\d+)H/);
    return hoursMatch ? parseInt(hoursMatch[1], 10) : 1;
  }

  generateDurationLabel(dateStartString: string, duration: string): string {
    const dateStart = new Date(dateStartString);
    const day = dateStart.getDate();
    const year = dateStart.getFullYear();
    const month = String(dateStart.getMonth() + 1).padStart(2, '0');
    const startAt = dateStart.getHours();
    const endAt = startAt + this.parseDurationToHours(duration);

    return `${day}.${month}.${year} ${startAt}:00 - ${endAt}:00`;
  }

  generateDateLabel(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate();
    console.log('day: ', day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const startAt = date.getHours();
    return `${day}.${month}.${year} ${startAt}:00`;
  }
}
