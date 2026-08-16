import { computed, inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CalendarHelper {
  readonly hoursRange = Array.from({ length: 12 }, (_, i) => i + 10); // 10:00 - 21:00

  readonly weekDayLabels = [
    'CALENDAR.DAYS.MON',
    'CALENDAR.DAYS.TUE',
    'CALENDAR.DAYS.WED',
    'CALENDAR.DAYS.THU',
    'CALENDAR.DAYS.FRI',
    'CALENDAR.DAYS.SAT',
    'CALENDAR.DAYS.SUN',
  ];

  readonly monthLabels = [
    'CALENDAR.MONTHS.JAN',
    'CALENDAR.MONTHS.FEB',
    'CALENDAR.MONTHS.MAR',
    'CALENDAR.MONTHS.APR',
    'CALENDAR.MONTHS.MAY',
    'CALENDAR.MONTHS.JUN',
    'CALENDAR.MONTHS.JUL',
    'CALENDAR.MONTHS.AUG',
    'CALENDAR.MONTHS.SEP',
    'CALENDAR.MONTHS.OCT',
    'CALENDAR.MONTHS.NOV',
    'CALENDAR.MONTHS.DEC',
  ];

  getIsoWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  getWeekInfo(date: Date): {
    weekNumber: number;
    startMonthKey: string;
    endMonthKey: string | null;
  } {
    const startOfWeek = this.getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const startMonthKey = this.monthLabels[startOfWeek.getMonth()];
    const endMonthKey = this.monthLabels[endOfWeek.getMonth()];

    return {
      weekNumber: this.getIsoWeekNumber(date),
      startMonthKey: startMonthKey,
      endMonthKey: startMonthKey !== endMonthKey ? endMonthKey : null,
    };
  }

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

  parseDurationToHours(isoDuration: string | null | undefined): number {
    if (!isoDuration || typeof isoDuration !== 'string') {
      return 1;
    }
    const hoursMatch = isoDuration.match(/(\d+)H/);
    return hoursMatch ? parseInt(hoursMatch[1], 10) : 1;
  }

  generatBanExpirationFromDate(dateString: Date): string {
    const date = new Date(dateString);
    const day = date.getDate();
    console.log('day: ', day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const startAt = date.getHours();
    const minutes = date.getMinutes();
    let minutesString = '';
    if (minutes < 10) minutesString = `0${minutes}`;
    return `${day}.${month}.${year} ${startAt}:${minutesString}`;
  }

  generateDayLabel(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${day}.${month}.${year}`;
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const startAt = date.getHours();
    return `${day}.${month}.${year} ${startAt}:00`;
  }

  generateHourLabel(dateString: string): string {
    const date = new Date(dateString);
    const hour = date.getHours();
    let minute = date.getMinutes();
    let minuteString = '';
    if (minute === 0) {
      minuteString = '00';
    } else {
      minuteString = minute.toString();
    }
    return `${hour}:${minuteString}`;
  }
}
