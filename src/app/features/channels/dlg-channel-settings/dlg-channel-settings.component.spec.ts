import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DlgChannelSettingsComponent } from './dlg-channel-settings.component';

describe('DlgChannelSettingsComponent', () => {
  let component: DlgChannelSettingsComponent;
  let fixture: ComponentFixture<DlgChannelSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DlgChannelSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DlgChannelSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
