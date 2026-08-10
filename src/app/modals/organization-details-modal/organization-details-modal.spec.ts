import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationDetailsModal } from './organization-details-modal';

describe('OrganizationDetailsModal', () => {
  let component: OrganizationDetailsModal;
  let fixture: ComponentFixture<OrganizationDetailsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationDetailsModal],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationDetailsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
