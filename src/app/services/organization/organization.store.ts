import { computed, inject, Injectable, signal } from '@angular/core';
import { OrganizationFront } from '../../model/organizationFront';
import { Organization } from '../../model/organization';
import { User } from '../../model/user';
import { initialPage, Page } from '../../model/page';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class OrganizationStore {
  private readonly route = inject(ActivatedRoute);

  readonly organizationsPage = signal<Page<Organization>>(initialPage);
  readonly organizations = computed(() => this.organizationsPage().content);
  readonly allOrganizations = signal<Organization[]>([]);
  readonly userOrganizations = signal<Organization[]>([]);

  readonly selectedOrganization = signal<Organization | null>(null);
  readonly organizationListSelectedUser = signal<User | null>(null);

  readonly userOrgsMap = computed(() => new Map(this.organizations().map((o) => [o.id, o.name])));
  readonly allOrgsMap = computed(() => new Map(this.allOrganizations().map((o) => [o.id, o.name])));
  readonly teamsList = signal<OrganizationFront[]>([]);
  readonly orgAndMembersMap = signal<Map<Organization, User[]>>(new Map());

  readonly organizationsPageQueryParamName = signal<string>('orgsPage');
  readonly organizationsSizeQueryParamName = signal<string>('orgsSize');

  readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Params });

  readonly currentOrganizationsSize = computed(
    () => Number(this.queryParams()[this.organizationsSizeQueryParamName()]) || 10,
  );
  readonly currentOrganizationsPage = computed(
    () => Number(this.queryParams()[this.organizationsPageQueryParamName()]) || 0,
  );

  readonly toolbarSelectedIds = signal<Set<number>>(new Set());

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
