import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDetailsModal } from './user-details-modal';

describe('UserDetailsModal', () => {
  let component: UserDetailsModal;
  let fixture: ComponentFixture<UserDetailsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDetailsModal],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
