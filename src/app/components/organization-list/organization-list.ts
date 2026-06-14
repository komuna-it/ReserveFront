import { Component, inject, Input, OnInit, OnDestroy, computed } from '@angular/core';
import { ReservationStore } from '../reservation/reservation.store';
import { ReservationFacade } from '../reservation/reservation.facade';

@Component({
  selector: 'app-organization-list',
  imports: [],
  templateUrl: './organization-list.html',
  styleUrl: './organization-list.css',
})
export class OrganizationList implements OnInit, OnDestroy {
  readonly store = inject(ReservationStore);
  readonly facade = inject(ReservationFacade);

  ngOnInit(): void {
    this.facade.getAllMembersAllOrganizations();
  }
  ngOnDestroy(): void {
    // this.store.teamsList.set([]);
  }
}
