import { TestBed } from '@angular/core/testing';

import { ChannelsFacadeService } from './channels-facade.service';

describe('ChannelsFacadeService', () => {
  let service: ChannelsFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChannelsFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
