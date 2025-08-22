import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalBtnsComponent } from './legal-btns.component';

describe('LegalBtnsComponent', () => {
  let component: LegalBtnsComponent;
  let fixture: ComponentFixture<LegalBtnsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalBtnsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LegalBtnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
