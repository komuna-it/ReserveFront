import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { StatisticsService } from './statistics.service';
import { DailyStatisticsDto, StatisticsView } from './statistics.model';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [DecimalPipe, TranslocoPipe],
  templateUrl: './statistics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsComponent implements OnInit {
  private readonly statisticsService = inject(StatisticsService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<DailyStatisticsDto[]>([]);

  readonly view = signal<StatisticsView>('reservations');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  readonly roomColors = [
    'bg-blue-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-orange-500',
    'bg-indigo-500',
  ];

  readonly roomSeries = computed(() => {
    const rooms = new Map<number, string>();

    for (const day of this.data()) {
      for (const room of day.rooms) {
        rooms.set(room.roomId, room.roomName);
      }
    }

    return [...rooms.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  });

  readonly maxReservations = computed(() =>
    Math.max(
      1,
      ...this.data().flatMap((day) => [day.total, ...day.rooms.map((room) => room.reservations)]),
    ),
  );

  readonly maxEarnings = computed(() =>
    Math.max(1, ...this.data().map((day) => day.earnings + day.unpaidEarnings)),
  );

  readonly totalReservations = computed(() => this.data().reduce((sum, day) => sum + day.total, 0));

  readonly totalEarnings = computed(() => this.data().reduce((sum, day) => sum + day.earnings, 0));

  readonly totalByRoom = computed(() => {
    const totals = new Map<
      number,
      {
        roomId: number;
        roomName: string;
        reservations: number;
        earnings: number;
      }
    >();

    for (const day of this.data()) {
      for (const room of day.rooms) {
        const current = totals.get(room.roomId);

        totals.set(room.roomId, {
          roomId: room.roomId,
          roomName: room.roomName,
          reservations: (current?.reservations ?? 0) + room.reservations,
          earnings: (current?.earnings ?? 0) + room.earnings,
        });
      }
    }

    return [...totals.values()].sort((a, b) => a.roomName.localeCompare(b.roomName, 'pl'));
  });

  ngOnInit(): void {
    this.setCurrentMonth();
    this.loadStatistics();
    this.statisticsService.getCounts().subscribe({
      next: (result) => {
        this.totalUsers.set(result.totalUsers);
        this.totalOrganizations.set(result.totalOrganizations);
      },
      error: (err) => {
        console.error('Failed to load statistics counts', err);
      },
    });
  }

  private setCurrentMonth(): void {
    const now = new Date();

    this.dateFrom.set(this.formatDate(new Date(now.getFullYear(), now.getMonth(), 1)));

    this.dateTo.set(this.formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  loadStatistics(): void {
    const from = this.dateFrom();
    const to = this.dateTo();

    if (!from || !to) {
      this.error.set('Wybierz obie daty.');
      return;
    }

    if (from > to) {
      this.error.set('Data początkowa nie może być późniejsza niż końcowa.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.statisticsService
      .getDailyStatistics(from, to)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => this.data.set(result),
        error: (err) => {
          console.error('Failed to load daily statistics', err);
          this.error.set('Nie udało się pobrać statystyk.');
        },
      });
  }

  updateDateFrom(event: Event): void {
    this.dateFrom.set((event.target as HTMLInputElement).value);
  }

  updateDateTo(event: Event): void {
    this.dateTo.set((event.target as HTMLInputElement).value);
  }

  setView(view: StatisticsView): void {
    this.view.set(view);
  }

  reservationHeight(value: number): number {
    return (value / this.maxReservations()) * 80;
  }

  earningsHeight(value: number): number {
    return (value / this.maxEarnings()) * 80;
  }

  roomColor(index: number): string {
    return this.roomColors[index % this.roomColors.length];
  }

  formatDay(date: string): string {
    const [, month, day] = date.split('-');
    return `${day}-${month}`;
  }

  formatDateRange(): string {
    return `${this.formatDay(this.dateFrom())} – ${this.formatDay(this.dateTo())}`;
  }

  readonly chartWidth = computed(() => {
    const days = this.data().length;
    const minDayWidth = 48;

    return Math.max(days * minDayWidth, 100);
  });

  formatAmount(value: number): string {
    return `${new Intl.NumberFormat('pl-PL', {
      maximumFractionDigits: 0,
    }).format(value)} zł`;
  }

  readonly totalUsers = signal(0);
  readonly totalOrganizations = signal(0);

  readonly totalUnpaidEarnings = computed(() =>
    this.data().reduce((sum, day) => sum + day.unpaidEarnings, 0),
  );

  readonly totalEarningsByRoom = computed(() => {
    const totals = new Map<
      number,
      {
        roomId: number;
        roomName: string;
        earnings: number;
        unpaidEarnings: number;
      }
    >();

    for (const day of this.data()) {
      for (const room of day.rooms) {
        const current = totals.get(room.roomId);

        totals.set(room.roomId, {
          roomId: room.roomId,
          roomName: room.roomName,
          earnings: (current?.earnings ?? 0) + room.earnings,
          unpaidEarnings: (current?.unpaidEarnings ?? 0) + room.unpaidEarnings,
        });
      }
    }

    return [...totals.values()].sort((a, b) => a.roomName.localeCompare(b.roomName, 'pl'));
  });
}
