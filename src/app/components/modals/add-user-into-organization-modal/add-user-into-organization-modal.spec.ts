import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserIntoOrganizationModal } from './add-user-into-organization-modal';

describe('AddUserIntoOrganizationModal', () => {
  let component: AddUserIntoOrganizationModal;
  let fixture: ComponentFixture<AddUserIntoOrganizationModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUserIntoOrganizationModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AddUserIntoOrganizationModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
