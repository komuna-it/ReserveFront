import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DailyStatisticsDto, StatisticsCountsDto } from './statistics.model';

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/statistics`;

  getDailyStatistics(dateFrom: string, dateTo: string): Observable<DailyStatisticsDto[]> {
    const params = new HttpParams().set('dateFrom', dateFrom).set('dateTo', dateTo);

    return this.http.get<DailyStatisticsDto[]>(`${this.apiUrl}/daily`, { params });
  }

  getCounts(): Observable<StatisticsCountsDto> {
    return this.http.get<StatisticsCountsDto>(`${this.apiUrl}/counts`);
  }
}
