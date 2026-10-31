import { TestBed } from '@angular/core/testing';
import { AppwriteService } from '../../lib/appwrite';

describe('AppwriteService', () => {
  let service: AppwriteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppwriteService]
    });

    service = TestBed.inject(AppwriteService);
  });

  it('should create service', () => {
    expect(service).toBeTruthy();
  });

  it('should have getMenu method', () => {
    expect(typeof service.getMenu).toBe('function');
  });
});