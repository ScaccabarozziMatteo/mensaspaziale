import { TestBed } from '@angular/core/testing';
import { AppwriteService } from '../../lib/appwrite';

describe('AppwriteService', () => {
  let service: AppwriteService;
  let listRows: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AppwriteService] });
    service = TestBed.inject(AppwriteService);
    listRows = spyOn<any>(service['tablesDB'], 'listRows');
  });

  it('creates the Appwrite menu service', () => {
    expect(service).toBeTruthy();
    expect(typeof service.getMenu).toBe('function');
  });

  it('maps a menu row to the app model and supplies empty label arrays when omitted', async () => {
    listRows.and.resolveTo({ rows: [{
      $id: 'row-1', week: 2, day: 3,
      primi_piatti: ['Pasta'], secondi_piatti: ['Tofu'],
      piatto_dello_chef: 'Chef', contorni: ['Insalata'], alternative_variabili: ['Uova']
    }] });

    const result = await service.getMenu(2, 3);

    expect(listRows).toHaveBeenCalled();
    expect(result).toEqual(jasmine.objectContaining({
      id: 'row-1', week: 2, day: 3,
      primi_piatti: ['Pasta'], secondi_piatti: ['Tofu'],
      piatto_dello_chef: 'Chef', contorni: ['Insalata'], alternative_variabili: ['Uova'],
      meat_label: [], fish_label: [], vegan_label: []
    }));
  });

  it('returns null when the requested menu row does not exist', async () => {
    listRows.and.resolveTo({ rows: [] });
    await expectAsync(service.getMenu(1, 0)).toBeResolvedTo(null);
  });

  it('rejects ambiguous duplicate menu rows', async () => {
    listRows.and.resolveTo({ rows: [{ $id: 'a' }, { $id: 'b' }] });
    await expectAsync(service.getMenu(1, 0)).toBeRejectedWithError(/Multiple menu rows/);
  });

  it('propagates Appwrite request errors', async () => {
    listRows.and.rejectWith(new Error('network error'));
    await expectAsync(service.getMenu(1, 0)).toBeRejectedWithError('network error');
  });
});
