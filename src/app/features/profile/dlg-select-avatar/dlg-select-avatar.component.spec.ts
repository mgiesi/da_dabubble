import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DlgSelectAvatarComponent } from './dlg-select-avatar.component';

describe('DlgSelectAvatarComponent', () => {
  let component: DlgSelectAvatarComponent;
  let fixture: ComponentFixture<DlgSelectAvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DlgSelectAvatarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DlgSelectAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
