import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AppwriteService } from '../../lib/appwrite';
import { DailyMenu } from '../models/menu.model';
import { AnalyticsService } from '../service/analyticsService';
import { MenuComponent } from './menu.component';

function pointerEvent(type: string, init: MouseEventInit): PointerEvent {
  return new MouseEvent(type, init) as unknown as PointerEvent;
}

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let appwrite: { getMenu: ReturnType<typeof vi.fn> };
  let analytics: {
    dayChanged: ReturnType<typeof vi.fn>;
    menuLoaded: ReturnType<typeof vi.fn>;
    menuError: ReturnType<typeof vi.fn>;
    weekendViewed: ReturnType<typeof vi.fn>;
    guideToggled: ReturnType<typeof vi.fn>;
    swipeHintShown: ReturnType<typeof vi.fn>;
    swipeHintDismissed: ReturnType<typeof vi.fn>;
  };
  let storage: {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
  };
  let storageAccess: MockInstance;

  const menu = new DailyMenu(
    'menu-1', 0, 0,
    ['Pasta', 'Riso'], ['Pollo'], 'Chef', ['Insalata'], ['Formaggio'],
    new Date(2026, 9, 26).toLocaleDateString(),
    [false, true, true, false, false],
    [false, false, false, false, false],
    [false, false, false, false, true]
  );

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 26, 12));
    appwrite = { getMenu: vi.fn() };
    storage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
    storage.getItem.mockReturnValue(null);
    analytics = {
      dayChanged: vi.fn(),
      menuLoaded: vi.fn(),
      menuError: vi.fn(),
      weekendViewed: vi.fn(),
      guideToggled: vi.fn(),
      swipeHintShown: vi.fn(),
      swipeHintDismissed: vi.fn()
    };
    appwrite.getMenu.mockResolvedValue(menu);

    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [
        { provide: AppwriteService, useValue: appwrite },
        { provide: AnalyticsService, useValue: analytics },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    storageAccess = vi.spyOn(component as any, 'storage')
      .mockReturnValue(storage as unknown as Storage);
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('initializes the weekday, requests its menu and hides the loader', async () => {
    component.ngOnInit();
    await Promise.resolve();

    expect(component.italianDayName()).toBe('Lunedì');
    expect(component.dayOfWeekNumber()).toBe(0);
    expect(appwrite.getMenu).toHaveBeenCalledWith(0, 0);
    expect(component.menu()?.id).toBe('menu-1');
    expect(component.loading()).toBe(false);
  });

  it('shows the weekend state without requesting a menu', () => {
    component.displayDate.set(new Date(2026, 9, 31, 12));
    component.dayOffset.set(5);
    component.ngOnInit();

    expect(component.weekend()).toBe(true);
    expect(appwrite.getMenu).not.toHaveBeenCalled();
    expect(analytics.weekendViewed).toHaveBeenCalled();
  });

  it('uses a Monday anchor for the four-week cycle, including dates before the anchor', () => {
    component.displayDate.set(new Date(2026, 9, 26));
    expect(component.getMenuWeekNumber()).toBe(0);

    component.displayDate.set(new Date(2026, 9, 19));
    expect(component.getMenuWeekNumber()).toBe(3);

    component.displayDate.set(new Date(2026, 10, 23));
    expect(component.getMenuWeekNumber()).toBe(0);
  });

  it('maps dates to Monday-first day indexes and Italian names', () => {
    expect(component.getDayOfWeek(new Date(2026, 9, 26))).toBe(0);
    expect(component.getDayOfWeek(new Date(2026, 9, 31))).toBe(5);
    expect(component.getItalianDayName(new Date(2026, 9, 26))).toBe('Lunedì');
    expect(component.getItalianDayName(new Date(2026, 9, 25))).toBe('Domenica');
  });

  it('builds course cards and merges variable alternatives into secondi', async () => {
    component.menuWeekNumber.set(0);
    component.dayOfWeekNumber.set(0);
    await component.loadMenu();

    const courses = component.coursesCreator();
    expect(courses.map(course => course.title)).toEqual(['Primi', 'Secondi', 'Contorni', 'Dessert']);
    expect(courses[1].dishes).toEqual(['Pollo', 'Formaggio']);
    expect(courses[1].meat_label).toEqual([true, false]);
    expect(courses[1].vegan_label).toEqual([false, true]);
    expect(courses[3].dishes.length).toBe(6);
    expect(analytics.menuLoaded).toHaveBeenCalledWith(expect.objectContaining({ source: 'network' }));
  });

  it('uses a fresh cache entry without requesting the network', async () => {
    storage.getItem.mockReturnValue(JSON.stringify(menu));
    component.menuWeekNumber.set(0);
    component.dayOfWeekNumber.set(0);

    await component.loadMenu();

    expect(component.menu()?.id).toBe('menu-1');
    expect(appwrite.getMenu).not.toHaveBeenCalled();
    expect(analytics.menuLoaded).toHaveBeenCalledWith(expect.objectContaining({ source: 'cache' }));
  });

  it('keeps a menu cached until the end of the day', async () => {
    storage.getItem.mockReturnValue(JSON.stringify({
      expiresAt: new Date(2026, 9, 27, 0, 0, 0, 0).getTime(),
      menu
    }));
    component.menuWeekNumber.set(0);
    component.dayOfWeekNumber.set(0);

    await component.loadMenu();

    expect(component.menu()?.id).toBe('menu-1');
    expect(appwrite.getMenu).not.toHaveBeenCalled();
    expect(analytics.menuLoaded).toHaveBeenCalledWith(expect.objectContaining({ source: 'cache' }));
  });

  it('refreshes the menu once the cached entry has expired', async () => {
    storage.getItem.mockReturnValue(JSON.stringify({
      expiresAt: new Date(2026, 9, 25, 23, 59, 59).getTime(),
      menu
    }));
    component.menuWeekNumber.set(0);
    component.dayOfWeekNumber.set(0);

    await component.loadMenu();

    expect(storage.removeItem).toHaveBeenCalledWith('menu-0-0');
    expect(appwrite.getMenu).toHaveBeenCalledWith(0, 0);
    expect(component.menu()?.id).toBe('menu-1');
    expect(analytics.menuLoaded).toHaveBeenCalledWith(expect.objectContaining({ source: 'network' }));
  });

  it('prunes expired menu entries at startup but keeps unrelated storage', () => {
    const entries = new Map<string, string>([
      ['menu-0-0', JSON.stringify({ expiresAt: Date.now() - 1, menu })],
      ['menu-0-1', JSON.stringify({ expiresAt: Date.now() + 60_000, menu })],
      ['swipe-hint-seen', 'true']
    ]);
    const memoryStorage = {
      get length() {
        return entries.size;
      },
      key: (index: number) => Array.from(entries.keys())[index] ?? null,
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => {
        entries.set(key, value);
      },
      removeItem: (key: string) => {
        entries.delete(key);
      },
      clear: () => entries.clear()
    } as Storage;
    storageAccess.mockReturnValue(memoryStorage);

    component.ngOnInit();

    expect(entries.has('menu-0-0')).toBe(false);
    expect(entries.has('menu-0-1')).toBe(true);
    expect(entries.has('swipe-hint-seen')).toBe(true);
  });

  it('discards malformed or stale cache and fetches a fresh menu', async () => {
    storage.getItem.mockReturnValue('{bad json');
    component.menuWeekNumber.set(0);
    component.dayOfWeekNumber.set(0);

    await component.loadMenu();

    expect(storage.removeItem).toHaveBeenCalledWith('menu-0-0');
    expect(appwrite.getMenu).toHaveBeenCalledWith(0, 0);
    expect(component.menu()?.id).toBe('menu-1');
  });

  it('does not fail a loaded menu when browser storage is unavailable', async () => {
    storage.getItem.mockImplementation(() => { throw new Error('storage blocked'); });
    storage.setItem.mockImplementation(() => { throw new Error('storage blocked'); });
    storage.removeItem.mockImplementation(() => { throw new Error('storage blocked'); });
    component.menuWeekNumber.set(0);
    component.dayOfWeekNumber.set(0);

    await component.loadMenu();

    expect(component.menu()?.id).toBe('menu-1');
    expect(component.error()).toBe(false);
  });

  it('shows an error for a missing menu and can retry', async () => {
    appwrite.getMenu.mockResolvedValue(null);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    component.italianDayName.set('Lunedì');
    await component.loadMenu();
    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);

    appwrite.getMenu.mockResolvedValue(menu);
    component.retryLoadMenu();
    await Promise.resolve();
    expect(component.error()).toBe(false);
    expect(component.menu()?.id).toBe('menu-1');
  });

  it('shows an error when Appwrite rejects', async () => {
    appwrite.getMenu.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    component.italianDayName.set('Lunedì');

    await component.loadMenu();

    expect(component.error()).toBe(true);
    expect(analytics.menuError).toHaveBeenCalledWith({ course: 'Lunedì' });
  });

  it('moves forward by button and swipe, but stops before the weekend', () => {
    component.dayOffset.set(0);
    component.dayOfWeekNumber.set(0);
    component.italianDayName.set('Lunedì');
    component.nextDay();
    vi.advanceTimersByTime(300);
    expect(component.dayOffset()).toBe(1);
    expect(analytics.dayChanged).toHaveBeenCalledWith(expect.objectContaining({
      direction: 'next', method: 'button', to: 'Martedì'
    }));

    component.dayOffset.set(4);
    component.dayOfWeekNumber.set(4);
    component.italianDayName.set('Venerdì');
    component.nextDay();
    vi.advanceTimersByTime(300);
    expect(component.dayOffset()).toBe(4);
  });

  it('moves backward by button and blocks moving before Monday', () => {
    component.dayOffset.set(1);
    component.dayOfWeekNumber.set(1);
    component.italianDayName.set('Martedì');
    component.previousDay();
    vi.advanceTimersByTime(300);
    expect(component.dayOffset()).toBe(0);
    expect(analytics.dayChanged).toHaveBeenCalledWith(expect.objectContaining({
      direction: 'previous', method: 'button', to: 'Lunedì'
    }));

    component.dayOfWeekNumber.set(0);
    component.previousDay();
    vi.advanceTimersByTime(300);
    expect(component.dayOffset()).toBe(0);
  });

  it('handles swipe hints and ignores short or vertical gestures', () => {
    component.showSwipeHint.set(true);
    vi.spyOn(component, 'nextDay');
    vi.spyOn(component, 'previousDay');
    component.onPointerDown(pointerEvent('pointerdown', { clientX: 150, clientY: 100 }));
    expect(component.showSwipeHint()).toBe(false);
    expect(analytics.swipeHintDismissed).toHaveBeenCalledWith({ via: 'tap' });

    component.onPointerUp(pointerEvent('pointerup', { clientX: 180, clientY: 100 }));
    component.onPointerDown(pointerEvent('pointerdown', { clientX: 150, clientY: 100 }));
    component.onPointerUp(pointerEvent('pointerup', { clientX: 80, clientY: 200 }));
    expect(component.nextDay).not.toHaveBeenCalled();
    expect(component.previousDay).not.toHaveBeenCalled();

    component.onPointerDown(pointerEvent('pointerdown', { clientX: 150, clientY: 100 }));
    component.onPointerUp(pointerEvent('pointerup', { clientX: 80, clientY: 101 }));
    expect(component.nextDay).toHaveBeenCalledWith('swipe');
  });

  it('reports guide toggles and weekend state', () => {
    component.coursesCreator.set([{ id: 'primi', title: 'Primi', icon: '', dishes: [], meat_label: [], fish_label: [], vegan_label: [] }]);
    component.onGuideToggled(true);
    expect(analytics.guideToggled).toHaveBeenCalledWith({ open: true, courses: 1 });

    component.dayOfWeekNumber.set(6);
    component.handleWeekend();
    expect(component.weekend()).toBe(true);
  });
});
