import { inject, Injectable, isDevMode } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Organization } from '../../model/organization';
import { Observable } from 'rxjs';
import { Page } from '../../model/page';
import { OrganizationMemberDto } from '../../model/organizationMemberDto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrganizationApi {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  createOrganization(name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/organizations`, { name });
  }

  removeOrg(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/organizations/decommission/${id}`);
  }

  markOrganizationsAsTrusted(organizationIds: number[]): Observable<Organization> {
    return this.http.patch<Organization>(`${this.apiUrl}/organizations/trustedStatus`, {
      organizationIds: organizationIds,
      trusted: true,
    });
  }

  markOrganizationsAsUntrusted(organizationIds: number[]): Observable<Organization> {
    return this.http.patch<Organization>(`${this.apiUrl}/organizations/trustedStatus`, {
      organizationIds: organizationIds,
      trusted: false,
    });
  }

  getOrganizations(
    page: number,
    size: number,
    fetchMembers: boolean,
    userId: number | null,
  ): Observable<Page<Organization>> {
    const params = new HttpParams()
      .set('userId', userId ?? '')
      .set('fetchMembers', fetchMembers)
      .set('page', page)
      .set('size', size);

    if (isDevMode()) {
      console.info('calling /organizations with params:', params.toString());
    }
    return this.http.get<Page<Organization>>(`${this.apiUrl}/organizations`, { params });
  }

  promoteMemberToOwner(userId: number, organizationId: number): Observable<OrganizationMemberDto> {
    return this.http.patch<OrganizationMemberDto>(
      `${this.apiUrl}/organizations/assigneUser/${userId}/role/OWNER/toOrganization/${organizationId}`,
      {},
    );
  }

  demoteOwnerToMember(userId: number, organizationId: number): Observable<OrganizationMemberDto> {
    return this.http.patch<OrganizationMemberDto>(
      `${this.apiUrl}/organizations/assigneUser/${userId}/role/MEMBER/toOrganization/${organizationId}`,
      {},
    );
  }

  removeUserFromOrganization(id: number, organizationId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/organizations/removeMember/${id}/fromOrganization/${organizationId}`,
      {},
    );
  }

  removeOwnerFromOrganization(userId: number, organizationId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/organizations/assigneUser/${userId}/role/MEMBER/toOrganization/${organizationId}`,
      {},
    );
  }

  addOwnerIntoOrganization(userId: number, organizationId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/organizations/addOwner/${userId}/toOrganization/${organizationId}`,
      {},
    );
  }

  addMemberIntoOrganization(id: number, organizationId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/organizations/addMember/${id}/toOrganization/${organizationId}`,
      {},
    );
  }
}
