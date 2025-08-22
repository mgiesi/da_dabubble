import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DlgProfileMenuComponent } from './dlg-profile-menu.component';

describe('DlgProfileMenuComponent', () => {
  let component: DlgProfileMenuComponent;
  let fixture: ComponentFixture<DlgProfileMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DlgProfileMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DlgProfileMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
