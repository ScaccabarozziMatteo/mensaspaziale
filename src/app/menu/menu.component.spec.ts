import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuComponent } from './menu.component';
import { AnalyticsService } from '../service/analyticsService';
import { AppwriteService } from '../../lib/appwrite';
import { PLATFORM_ID } from '@angular/core';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let mockAnalytics: jasmine.SpyObj<AnalyticsService>;
  let mockAppwrite: jasmine.SpyObj<AppwriteService>;

  const mockMenu = {
    id: 'menu-1',
    week: 1,
    day: 0,
    primi_piatti: ['pasta', 'risotto'],
    secondi_piatti: ['pollo', 'manzo'],
    piatto_dello_chef: 'Insalata',
    contorni: ['insalata', 'patate'],
    alternative_variabili: ['Formaggio', 'Salume'],
    date: '25/10/2025',
    meat_label: [true, false, false, true, false, false, true, false, false, true, false, false],
    fish_label: [false, true, false, false, true, false, false, true, false, false, false, true],
    vegan_label: [false, false, true, false, false, true, false, false, true, false, true, false]
  };

  beforeEach(async () => {
    mockAnalytics = jasmine.createSpyObj('AnalyticsService', ['dayChanged', 'menuLoaded', 'menuError', 'weekendViewed']);
    mockAppwrite = jasmine.createSpyObj('AppwriteService', ['getMenu']);

    await TestBed.configureTestingModule({
      declarations: [MenuComponent],
      providers: [
        { provide: AppwriteService, useValue: mockAppwrite },
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    // Mock localStorage
    spyOn(window.localStorage, 'getItem').and.callFake(() => null);
    spyOn(window.localStorage, 'setItem').and.callFake(() => {});
    spyOn(window.localStorage, 'clear').and.callFake(() => {});
    
    // Set initial values
    component.dayOffset.set(0);
    component.loading.set(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load menu from appwrite', async () => {
    mockAppwrite.getMenu.and.returnValue(Promise.resolve(mockMenu));
    
    await component.loadMenu();
    
    expect(mockAppwrite.getMenu).toHaveBeenCalledWith(1, 0);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeFalse();
    expect(component.menu()).toEqual(mockMenu);
  });

  it('should navigate to next day', () => {
    spyOn(mockAnalytics, 'dayChanged').and.callThrough();
    component.nextDay();
    
    expect(mockAnalytics.dayChanged).toHaveBeenCalledWith(
      jasmine.objectContaining({
        from: 'Lunedì',
        to: 'Martedì',
        direction: 'next',
        method: 'button'
      })
    );
  });

  it('should navigate to previous day', () => {
    spyOn(mockAnalytics, 'dayChanged').and.callThrough();
    component.previousDay();
    
    expect(mockAnalytics.dayChanged).toHaveBeenCalledWith(
      jasmine.objectContaining({
        from: 'Lunedì',
        to: 'Domenica',
        direction: 'previous',
        method: 'button'
      })
    );
  });

  it('should show swipe hint on mobile', () => {
    component.isMobile.set(true);
    component.showSwipeHint.set(false);
    spyOn(component['storage']() as any, 'setItem').and.callFake(() => {});
    
    component.ngOnInit();
    
    expect(component.showSwipeHint()).toBeTrue();
    expect(mockAnalytics.swipeHintShown).toHaveBeenCalled();
  });
});