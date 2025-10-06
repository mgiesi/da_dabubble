import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DlgCreateChannelComponent } from './dlg-create-channel.component';

describe('DlgCreateChannelComponent', () => {
  let component: DlgCreateChannelComponent;
  let fixture: ComponentFixture<DlgCreateChannelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DlgCreateChannelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DlgCreateChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
