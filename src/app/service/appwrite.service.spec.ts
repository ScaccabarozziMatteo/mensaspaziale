import { describe, expect, it, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AppwriteService } from '../../lib/appwrite';

describe('AppwriteService', () => {
  let service: AppwriteService;
  let listRows: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AppwriteService] });
    service = TestBed.inject(AppwriteService);
    listRows = vi.fn();
    (service['tablesDB'] as unknown as { listRows: typeof listRows }).listRows = listRows;
  });

  it('creates the Appwrite menu service', () => {
    expect(service).toBeTruthy();
    expect(typeof service.getMenu).toBe('function');
  });

  it('maps a menu row to the app model and supplies empty label arrays when omitted', async () => {
    listRows.mockResolvedValue({ rows: [{
      $id: 'row-1', week: 2, day: 3,
      primi_piatti: ['Pasta'], secondi_piatti: ['Tofu'],
      piatto_dello_chef: 'Chef', contorni: ['Insalata'], alternative_variabili: ['Uova']
    }] });

    const result = await service.getMenu(2, 3);

    expect(listRows).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({
      id: 'row-1', week: 2, day: 3,
      primi_piatti: ['Pasta'], secondi_piatti: ['Tofu'],
      piatto_dello_chef: 'Chef', contorni: ['Insalata'], alternative_variabili: ['Uova'],
      meat_label: [], fish_label: [], vegan_label: []
    }));
  });

  it('returns null when the requested menu row does not exist', async () => {
    listRows.mockResolvedValue({ rows: [] });
    await expect(service.getMenu(1, 0)).resolves.toBeNull();
  });

  it('rejects ambiguous duplicate menu rows', async () => {
    listRows.mockResolvedValue({ rows: [{ $id: 'a' }, { $id: 'b' }] });
    await expect(service.getMenu(1, 0)).rejects.toThrow(/Multiple menu rows/);
  });

  it('propagates Appwrite request errors', async () => {
    listRows.mockRejectedValue(new Error('network error'));
    await expect(service.getMenu(1, 0)).rejects.toThrow('network error');
  });
});
