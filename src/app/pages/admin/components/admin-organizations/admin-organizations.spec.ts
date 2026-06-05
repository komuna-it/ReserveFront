import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOrganizations } from './admin-organizations';

describe('AdminOrganizations', () => {
  let component: AdminOrganizations;
  let fixture: ComponentFixture<AdminOrganizations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOrganizations],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOrganizations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
