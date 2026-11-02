import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analyticsService';
import { PLATFORM_ID } from '@angular/core';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        AnalyticsService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    service = TestBed.inject(AnalyticsService);
  });

  beforeEach(() => {
    // Mock window.gtag globally
    (window as any).gtag = vi.fn();
  });

  afterEach(() => {
    delete (window as any).gtag;
  });

  it('should create service', () => {
    expect(service).toBeTruthy();
  });

  it('should track dayChanged event', () => {
    service.dayChanged({
      from: 'Lunedì',
      to: 'Martedì',
      direction: 'next',
      method: 'button'
    });

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'day_changed', {
      from: 'Lunedì',
      to: 'Martedì',
      direction: 'next',
      method: 'button'
    });
  });

  it('should track menuLoaded event', () => {
    service.menuLoaded({
      source: 'cache' as const,
      course: 'Primi',
      durationMs: 100
    });

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'menu_loaded', {
      source: 'cache',
      course: 'Primi',
      durationMs: 100
    });
  });

  it('should track menuError event', () => {
    service.menuError({
      course: 'Primi'
    });

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'menu_error', {
      course: 'Primi'
    });
  });

  it('should track weekendViewed event', () => {
    service.weekendViewed();

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'weekend_viewed', {});
  });

  it('should track guideToggled event', () => {
    service.guideToggled({ open: true, courses: 4 });

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'guide_toggled', {
      open: true,
      courses: 4
    });
  });

  it('should track swipeHintShown event', () => {
    service.swipeHintShown();

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'swipe_hint_shown', {});
  });

  it('should track swipeHintDismissed event', () => {
    service.swipeHintDismissed({ via: 'tap' });

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'swipe_hint_dismissed', {
      via: 'tap'
    });
  });

  it('should track swipeHintDismissed event with swipe', () => {
    service.swipeHintDismissed({ via: 'swipe' });

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'swipe_hint_dismissed', {
      via: 'swipe'
    });
  });

  it('should not throw when gtag is not a function', () => {
    (window as any).gtag = undefined;
    
    service.dayChanged({
      from: 'Lunedì',
      to: 'Martedì',
      direction: 'next',
      method: 'button'
    });

    expect(true).toBe(true);
  });

  it('does not access gtag outside the browser', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AnalyticsService, { provide: PLATFORM_ID, useValue: 'server' }]
    });
    service = TestBed.inject(AnalyticsService);
    const gtag = (window as any).gtag as Mock;

    service.track('server_event');

    expect(gtag).not.toHaveBeenCalled();
  });
});
