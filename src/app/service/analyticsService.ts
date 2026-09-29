import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type DayNavMethod = 'swipe' | 'button';
export type DayNavDirection = 'next' | 'previous';
export type MenuSource = 'cache' | 'network';

/**
 * Thin wrapper over the gtag.js snippet already present in index.html.
 *
 * gtag is the single source of truth here on purpose. Firebase Analytics used
 * to be initialised against the same measurement ID, which double-counted
 * every page view and every event; it has been removed from main.ts.
 *
 * Every method is a no-op when gtag is unavailable (server-side render, an
 * ad blocker that stripped the tag, or a browser that failed to load it), so
 * callers never need to guard.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly platformId = inject(PLATFORM_ID);

  track(event: string, params: Record<string, unknown> = {}): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const gtag = window.gtag;
    if (typeof gtag !== 'function') {
      return;
    }

    gtag('event', event, params);
  }

  dayChanged(params: {
    from: string;
    to: string;
    direction: DayNavDirection;
    method: DayNavMethod;
  }): void {
    this.track('day_changed', { ...params });
  }

  menuLoaded(params: {
    source: MenuSource;
    course: string;
    durationMs: number;
  }): void {
    this.track('menu_loaded', { ...params });
  }

  menuError(params: { course: string }): void {
    this.track('menu_error', { ...params });
  }

  weekendViewed(): void {
    this.track('weekend_viewed');
  }

  guideToggled(params: { open: boolean; courses: number }): void {
    this.track('guide_toggled', { ...params });
  }

  swipeHintShown(): void {
    this.track('swipe_hint_shown');
  }

  swipeHintDismissed(params: { via: 'tap' | 'swipe' }): void {
    this.track('swipe_hint_dismissed', { ...params });
  }
}
