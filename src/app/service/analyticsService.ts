import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { getAnalytics, logEvent } from 'firebase/analytics';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  private router = inject(Router);
  private analytics = getAnalytics();

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        logEvent(this.analytics, 'page_view', {
          page_location: window.location.href,
          page_path: event.urlAfterRedirects,
          page_title: document.title
        });
      });
  }
}