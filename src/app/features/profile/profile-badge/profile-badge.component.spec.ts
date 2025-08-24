import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileBadgeComponent } from './profile-badge.component';

describe('ProfileBadgeComponent', () => {
  let component: ProfileBadgeComponent;
  let fixture: ComponentFixture<ProfileBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileBadgeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
