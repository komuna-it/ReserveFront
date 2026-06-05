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
import { AdminCalendar } from '../../components/admin-calendar/admin-calendar';
import { Utils } from '../../services/utils/utils';

@Component({
  selector: 'app-admin',
  imports: [AdminCalendar],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminPage {
  readonly utils = inject(Utils);
}
