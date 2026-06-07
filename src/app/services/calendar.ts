import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Observable, tap, of, map, firstValueFrom } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { Utils } from './utils';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {}
