import { TestBed } from '@angular/core/testing';

import { TostService } from './tost.service';

describe('TostService', () => {
  let service: TostService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TostService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
