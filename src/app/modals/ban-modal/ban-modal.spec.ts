import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BanModal } from './ban-modal';

describe('BanModal', () => {
  let component: BanModal;
  let fixture: ComponentFixture<BanModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BanModal],
    }).compileComponents();

    fixture = TestBed.createComponent(BanModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
