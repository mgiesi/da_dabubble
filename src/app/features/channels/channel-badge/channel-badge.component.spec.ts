import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelBadgeComponent } from './channel-badge.component';

describe('ChannelBadgeComponent', () => {
  let component: ChannelBadgeComponent;
  let fixture: ComponentFixture<ChannelBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelBadgeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
