import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AppwriteService } from '../../lib/appwrite';
import { DailyMenu } from '../models/menu.model';
import { AnalyticsService } from '../service/analyticsService';
import { MenuComponent } from './menu.component';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let appwrite: jasmine.SpyObj<AppwriteService>;
  let analytics: jasmine.SpyObj<AnalyticsService>;
  let storage: jasmine.SpyObj<Storage>;

  const menu = new DailyMenu(
    'menu-1', 0, 0,
    ['Pasta', 'Riso'], ['Pollo'], 'Chef', ['Insalata'], ['Formaggio'],
    new Date(2026, 9, 26).toLocaleDateString(),
    [false, true, true, false, false],
    [false, false, false, false, false],
    [false, false, false, false, true]
  );

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 9, 26, 12));
    appwrite = jasmine.createSpyObj<AppwriteService>('AppwriteService', ['getMenu']);
    storage = jasmine.createSpyObj<Storage>('Storage', ['getItem', 'setItem', 'removeItem']);
    storage.getItem.and.returnValue(null);
    analytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', [
      'dayChanged', 'menuLoaded', 'menuError', 'weekendViewed', 'guideToggled',
      'swipeHintShown', 'swipeHintDismissed'
    ]);
    appwrite.getMenu.and.resolveTo(menu);

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
    spyOn<any>(component, 'storage').and.returnValue(storage);
  });

  afterEach(() => {
    fixture.destroy();
    jasmine.clock().uninstall();
  });

  it('initializes the weekday, requests its menu and hides the loader', async () => {
    component.ngOnInit();
    await Promise.resolve();

    expect(component.italianDayName()).toBe('Lunedì');
    expect(component.dayOfWeekNumber()).toBe(0);
    expect(appwrite.getMenu).toHaveBeenCalledWith(0, 0);
    expect(component.menu()?.id).toBe('menu-1');
    expect(component.loading()).toBeFalse();
  });

  it('shows the weekend state without requesting a menu', () => {
    component.displayDate.set(new Date(2026, 9, 31, 12));
    component.dayOffset.set(5);
    component.ngOnInit();

    expect(component.weekend()).toBeTrue();
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
    expect(analytics.menuLoaded).toHaveBeenCalledWith(jasmine.objectContaining({ source: 'network' }));
  });

  it('uses a fresh cache entry without requesting the network', async () => {
    storage.getItem.and.returnValue(JSON.stringify(menu));
    component.menuWeekNumber.set(0);
    component.dayOfWeekNumber.set(0);

    await component.loadMenu();

    expect(component.menu()?.id).toBe('menu-1');
    expect(appwrite.getMenu).not.toHaveBeenCalled();
    expect(analytics.menuLoaded).toHaveBeenCalledWith(jasmine.objectContaining({ source: 'cache' }));
  });

  it('discards malformed or stale cache and fetches a fresh menu', async () => {
    storage.getItem.and.returnValue('{bad json');
    component.menuWeekNumber.set(0);
    component.dayOfWeekNumber.set(0);

    await component.loadMenu();

    expect(storage.removeItem).toHaveBeenCalledWith('menu-0-0');
    expect(appwrite.getMenu).toHaveBeenCalledWith(0, 0);
    expect(component.menu()?.id).toBe('menu-1');
  });

  it('does not fail a loaded menu when browser storage is unavailable', async () => {
    storage.getItem.and.throwError('storage blocked');
    storage.setItem.and.throwError('storage blocked');
    storage.removeItem.and.throwError('storage blocked');
    component.menuWeekNumber.set(0);
    component.dayOfWeekNumber.set(0);

    await component.loadMenu();

    expect(component.menu()?.id).toBe('menu-1');
    expect(component.error()).toBeFalse();
  });

  it('shows an error for a missing menu and can retry', async () => {
    appwrite.getMenu.and.resolveTo(null);
    spyOn(console, 'error');
    component.italianDayName.set('Lunedì');
    await component.loadMenu();
    expect(component.error()).toBeTrue();
    expect(component.loading()).toBeFalse();

    appwrite.getMenu.and.resolveTo(menu);
    component.retryLoadMenu();
    await Promise.resolve();
    expect(component.error()).toBeFalse();
    expect(component.menu()?.id).toBe('menu-1');
  });

  it('shows an error when Appwrite rejects', async () => {
    appwrite.getMenu.and.rejectWith(new Error('offline'));
    spyOn(console, 'error');
    component.italianDayName.set('Lunedì');

    await component.loadMenu();

    expect(component.error()).toBeTrue();
    expect(analytics.menuError).toHaveBeenCalledWith({ course: 'Lunedì' });
  });

  it('moves forward by button and swipe, but stops before the weekend', () => {
    component.dayOffset.set(0);
    component.dayOfWeekNumber.set(0);
    component.italianDayName.set('Lunedì');
    component.nextDay();
    jasmine.clock().tick(300);
    expect(component.dayOffset()).toBe(1);
    expect(analytics.dayChanged).toHaveBeenCalledWith(jasmine.objectContaining({
      direction: 'next', method: 'button', to: 'Martedì'
    }));

    component.dayOffset.set(4);
    component.dayOfWeekNumber.set(4);
    component.italianDayName.set('Venerdì');
    component.nextDay();
    jasmine.clock().tick(300);
    expect(component.dayOffset()).toBe(4);
  });

  it('moves backward by button and blocks moving before Monday', () => {
    component.dayOffset.set(1);
    component.dayOfWeekNumber.set(1);
    component.italianDayName.set('Martedì');
    component.previousDay();
    jasmine.clock().tick(300);
    expect(component.dayOffset()).toBe(0);
    expect(analytics.dayChanged).toHaveBeenCalledWith(jasmine.objectContaining({
      direction: 'previous', method: 'button', to: 'Lunedì'
    }));

    component.dayOfWeekNumber.set(0);
    component.previousDay();
    jasmine.clock().tick(300);
    expect(component.dayOffset()).toBe(0);
  });

  it('handles swipe hints and ignores short or vertical gestures', () => {
    component.showSwipeHint.set(true);
    spyOn(component, 'nextDay');
    spyOn(component, 'previousDay');
    component.onPointerDown(new PointerEvent('pointerdown', { clientX: 150, clientY: 100 }));
    expect(component.showSwipeHint()).toBeFalse();
    expect(analytics.swipeHintDismissed).toHaveBeenCalledWith({ via: 'tap' });

    component.onPointerUp(new PointerEvent('pointerup', { clientX: 180, clientY: 100 }));
    component.onPointerDown(new PointerEvent('pointerdown', { clientX: 150, clientY: 100 }));
    component.onPointerUp(new PointerEvent('pointerup', { clientX: 80, clientY: 200 }));
    expect(component.nextDay).not.toHaveBeenCalled();
    expect(component.previousDay).not.toHaveBeenCalled();

    component.onPointerDown(new PointerEvent('pointerdown', { clientX: 150, clientY: 100 }));
    component.onPointerUp(new PointerEvent('pointerup', { clientX: 80, clientY: 101 }));
    expect(component.nextDay).toHaveBeenCalledWith('swipe');
  });

  it('reports guide toggles and weekend state', () => {
    component.coursesCreator.set([{ id: 'primi', title: 'Primi', icon: '', dishes: [], meat_label: [], fish_label: [], vegan_label: [] }]);
    component.onGuideToggled(true);
    expect(analytics.guideToggled).toHaveBeenCalledWith({ open: true, courses: 1 });

    component.dayOfWeekNumber.set(6);
    component.handleWeekend();
    expect(component.weekend()).toBeTrue();
  });
});
