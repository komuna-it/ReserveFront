import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnauthenticatedModal } from './unauthenticated-modal';

describe('UnauthenticatedModal', () => {
  let component: UnauthenticatedModal;
  let fixture: ComponentFixture<UnauthenticatedModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnauthenticatedModal],
    }).compileComponents();

    fixture = TestBed.createComponent(UnauthenticatedModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
