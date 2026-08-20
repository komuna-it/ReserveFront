import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Setting } from './model/setting';

@Injectable({ providedIn: 'root' })
export class SettingsApi {
  private http = inject(HttpClient);
  private apiUrl = process.env['VSF_API_URL'] || '/';

  getSettings(keys: Set<string> | null, all: boolean | null): Observable<Setting[]> {
    let params = new HttpParams();

    if (keys != null && keys.size > 0) {
      keys.forEach((key) => {
        params = params.append('keys', key);
      });
    }

    if (all !== null && all !== undefined) {
      params = params.append('all', all);
    }

    return this.http.get<Setting[]>(`${this.apiUrl}/settings`, { params });
  }

  updateSettings(settings: Set<Setting>): Observable<Setting[]> {
    const payload: Record<string, string> = {};

    if (settings != null && settings.size > 0) {
      settings.forEach((setting) => {
        payload[setting.key] = setting.value;
      });
    }

    return this.http.patch<Setting[]>(`${this.apiUrl}/settings`, { settings: payload });
  }

  deleteAccount() {
    return this.http.delete(`${this.apiUrl}/users`, {});
  }
}
