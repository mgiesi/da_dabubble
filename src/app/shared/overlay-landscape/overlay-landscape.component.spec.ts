import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayLandscapeComponent } from './overlay-landscape.component';

describe('OverlayLandscapeComponent', () => {
  let component: OverlayLandscapeComponent;
  let fixture: ComponentFixture<OverlayLandscapeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayLandscapeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverlayLandscapeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
