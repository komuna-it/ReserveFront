import { computed, inject, Injectable, signal } from '@angular/core';
import { User } from '../../model/user';
import { initialPage, Page } from '../../model/page';
import { Tab } from '../../model/tab';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly route = inject(ActivatedRoute);

  readonly selectedUser = signal<User | null>(null);
  readonly organizationListSelectedUser = signal<User | null>(null);
  readonly usersPage = signal<Page<User>>(initialPage);
  readonly allUsers = signal<User[]>([]);
  readonly users = computed(() => this.usersPage().content.filter((u) => u.nick !== 'SYSTEM'));

  readonly banReason = signal<string>('');
  readonly banDuration = signal<string>('');

  readonly usersPageQueryParamName = signal<string>('usersPage');
  readonly usersSizeQueryParamName = signal<string>('usersSize');

  readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Params });

  readonly currentUsersSize = computed(
    () => Number(this.queryParams()[this.usersSizeQueryParamName()]) || 10,
  );
  readonly currentUsersPage = computed(
    () => Number(this.queryParams()[this.usersPageQueryParamName()]) || 0,
  );

  readonly currentSortBy = computed<string>(
    () => (this.queryParams()['sortBy'] as string) ?? 'nick',
  );
  readonly currentSortDir = computed(
    () => (this.queryParams()['sortDir'] as 'asc' | 'desc') ?? 'desc',
  );

  readonly toolbarSelectedIds = signal<Set<number>>(new Set());

  activeTab = signal<Tab>(new Tab(0, 'Moje rezerwacje', 'reservations', undefined));

  toggleSelection(id: number): void {
    this.toolbarSelectedIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  setSelectedIds(ids: Set<number>): void {
    this.toolbarSelectedIds.set(ids);
  }

  clearSelection(): void {
    this.toolbarSelectedIds.set(new Set());
  }
}
