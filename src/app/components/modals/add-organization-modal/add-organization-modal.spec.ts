import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddOrganizationModal } from './add-organization-modal';

describe('AddOrganizationModal', () => {
  let component: AddOrganizationModal;
  let fixture: ComponentFixture<AddOrganizationModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddOrganizationModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AddOrganizationModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
