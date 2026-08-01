import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationMembers } from './organization-members';

describe('OrganizationMembers', () => {
  let component: OrganizationMembers;
  let fixture: ComponentFixture<OrganizationMembers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationMembers],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationMembers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
