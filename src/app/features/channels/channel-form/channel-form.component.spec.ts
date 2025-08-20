import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelFormComponent } from './channel-form.component';

describe('ChannelFormComponent', () => {
  let component: ChannelFormComponent;
  let fixture: ComponentFixture<ChannelFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
