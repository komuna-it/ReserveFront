import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { User } from '../../model/user';
import { Organization } from '../../model/organization';
import { ReservationDto } from '../../model/reservationDto';
import { Room } from '../../model/room';
import { Tab } from '../../model/tab';
import { OrganizationFront } from '../../model/organizationFront';
import { forkJoin, map } from 'rxjs';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ReservationWrapper } from '../../model/reservationWrapper';
import { ReservationFacade } from '../../components/reservation/reservation.facade';
import { ReservationStore } from '../../components/reservation/reservation.store';
import { CalendarHelper } from '../../components/calendar/calendar.helper';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage implements OnInit {
  readonly facade = inject(ReservationFacade);
  readonly authService = inject(AuthService);
  readonly helper = inject(CalendarHelper);
  readonly store = inject(ReservationStore);

  readonly email = this.authService.email();
  readonly reservationToDelete = signal<ReservationDto | null>(null);

  private sseController: AbortController | null = null;

  readonly userId = parseInt(this.authService.userId() || '-1');

  reservedByLabel(reservation: ReservationDto): string {
    const org = this.organizations().find((o) => o.id === reservation.behalfOf);
    return org ? `${org.name}` : `Nieznany`;
  }

  activeTab = signal<Tab>(new Tab(0, 'Moje rezerwacje', 'reservations', undefined));
  allTabs = signal<Tab[]>([]);
  activeOrgsUsers = computed(() => {
    const activeTab = this.activeTab();
    if (activeTab.type === 'organization' && activeTab.org) {
      return activeTab.org.members;
    }
    return [];
  });

  readonly organizations = signal<Organization[]>([]);
  readonly reservations = signal<ReservationDto[]>([]);
  readonly areYouSure = signal<boolean>(false);

  ngOnInit() {
    this.facade.getOrganizationsOfUser();
    this.facade.connectToReservationStream();
  }

  handleDeleteReservationClick(reservation: ReservationDto) {
    console.log('clicked remove reservationId: ' + reservation);
    this.reservationToDelete.set(reservation);
    this.areYouSure.set(true);
  }

  getReservationsWhereUserBelongs() {
    const orgs = this.organizations();
    if (orgs.length === 0) {
      this.reservations.set([]);
      return;
    }

    this.facade.getAllReservationsForUserAndTheirOrganization(
      parseInt(this.authService.userId() || '0'),
    );
  }
  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  formatDuration(durationStr: string): string {
    return durationStr.replace('PT', '').replace('H', ' godz ').replace('M', ' min');
  }

  buildTabs() {
    let id = 0;
    const newTabs: Tab[] = [];

    newTabs.push(new Tab(id++, 'Moje rezerwacje', 'reservations', undefined));

    for (const org of this.organizations()) {
      newTabs.push(new Tab(id++, org.name, 'organization', org));
    }
    newTabs.push(new Tab(id++, 'Utwórz zespół', 'createorganization', undefined));

    this.allTabs.set(newTabs);
  }
  deleteReservation(reservationId: number) {
    console.log(`Trying to delete reservation with id ${reservationId}`);
    this.facade.deleteReservation(reservationId);
    this.getReservationsWhereUserBelongs();
    this.areYouSure.set(false);
  }

  deleteTeamMember(userId: number) {
    console.log(`Trying to delete team member with id ${userId}`);
  }

  readonly clickedCreateTeam = signal(false);
  handleClickCreateTeam() {
    this.clickedCreateTeam.set(true);
  }

  createOrganization(event: Event, name: string) {
    event.preventDefault();

    if (!name.trim()) return;

    this.facade.createOrganization(name);
    this.facade.getOrganizationsOfUser();
  }

  ngOnDestroy() {
    if (this.sseController) {
      this.sseController.abort();
    }
  }
}
