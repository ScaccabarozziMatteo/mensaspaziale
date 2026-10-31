import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, PLATFORM_ID, signal, ChangeDetectionStrategy } from '@angular/core';
import { Renderer2 } from '@angular/core';
import { AppwriteService } from '../../lib/appwrite';
import { DailyMenu } from '../models/menu.model';
import { AnalyticsService, DayNavMethod } from '../service/analyticsService';
import { StarsDirective } from '../service/stars.directive';
import { MenuAlternativesComponent } from './menu-elements/menu-alternatives.component';
import { MenuSectionComponent } from './menu-elements/menu-section.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { menuCycle } from '../../environment/environment';

export type CourseId = 'primi' | 'secondi' | 'contorni' | 'dessert';

interface CourseSection {
  id: CourseId;
  title: string;
  icon: string;
  dishes: string[];
  meat_label: boolean[];
  fish_label: boolean[];
  vegan_label: boolean[];
}

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  host: { display: 'block' },
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [StarsDirective, MenuSectionComponent, MenuAlternativesComponent, MatProgressSpinnerModule]

})
export class MenuComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);
  private readonly appwrite = inject(AppwriteService);
  private readonly analytics = inject(AnalyticsService);

  menu = signal<DailyMenu | null>(null);
  italianDayName = signal<string>('')
  loading = signal(true);
  error = signal(false);
  weekend = signal(false);

  dayOffset = signal(0);
  displayDate = signal(new Date());

  readonly menuWeekNumber = signal(0);
  readonly dayOfWeekNumber = signal(0);

  private num_primi = signal(0);
  private num_secondi = signal(0);
  private num_contorni = signal(0);

  private startX = 0;
  private startY = 0;
  private tracking = false;

  readonly isMobile = signal(false);
  slideDirection = signal<'left' | 'right' | null>(null);
  showSwipeHint = signal(false);

  readonly coursesCreator = signal<CourseSection[]>([]);

  // Decorative streaks in the starfield. Negative delays spread across the 20s
  // CSS cycle so they are permanently out of phase with each other.
  readonly shootingStars = [
    { top: '6%', left: '52%', delay: '0s' },
    { top: '18%', left: '14%', delay: '-5s' },
    { top: '4%', left: '78%', delay: '-10s' },
    { top: '26%', left: '36%', delay: '-15s' }
  ] as const;

  readonly poke_ingredients = ['Ingredienti variabili'];

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isMobile.set(window.innerWidth <= 768);

    const unlisten = this.renderer.listen('window', 'resize', () => {
      this.isMobile.set(window.innerWidth <= 768);
    });
    this.destroyRef.onDestroy(unlisten);
  }

  ngOnInit(): void {
    this.updateDisplayDate();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.isMobile() && !this.readCache('swipe-hint-seen')) {
      this.showSwipeHint.set(true);
      this.analytics.swipeHintShown();
    }
  }

  private storage(): Storage | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  private readCache(key: string): string | null {
    try {
      return this.storage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private removeCache(key: string): void {
    try {
      this.storage()?.removeItem(key);
    } catch {
      // Storage may be disabled or full; menu loading should still work.
    }
  }

  private writeCache(key: string, value: string): void {
    try {
      this.storage()?.setItem(key, value);
    } catch {
      // Storage is an optimization; a failed write must not hide a loaded menu.
    }
  }

  private triggerSlide(direction: 'left' | 'right', action: () => void) {
    this.slideDirection.set(direction);
    setTimeout(() => {
      action();
      this.slideDirection.set(null);
    }, 300);
  }

  private updateDisplayDate() {
    const date = new Date();
    date.setDate(date.getDate() + this.dayOffset()); // usa sempre dayOffset

    this.displayDate.set(date);
    this.dayOfWeekNumber.set(this.getDayOfWeek(date));
    this.italianDayName.set(this.getItalianDayName(date));
    this.menuWeekNumber.set(this.getMenuWeekNumber());
    this.handleWeekend();

    if (this.weekend()) {
      this.analytics.weekendViewed();
    } else {
      this.loadMenu();
    }
  }

  nextDay(method: DayNavMethod = 'button') {
    const nextOffset = this.dayOffset() + 1;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + nextOffset);

    if (this.getDayOfWeek(futureDate) > 4) {
      return; // no weekend
    }

    const from = this.italianDayName();

    this.triggerSlide('left', () => {
      this.dayOffset.set(nextOffset);
      this.loading.set(true);
      this.menu.set(null);
      this.updateDisplayDate();

      this.analytics.dayChanged({
        from,
        to: this.italianDayName(),
        direction: 'next',
        method
      });
    });
  }

  previousDay(method: DayNavMethod = 'button') {
    if (this.dayOfWeekNumber() <= 0) {
      return;
    }

    const from = this.italianDayName();

    this.triggerSlide('right', () => {
      this.dayOffset.update(v => v - 1);
      this.loading.set(true);
      this.menu.set(null);
      this.updateDisplayDate();

      this.analytics.dayChanged({
        from,
        to: this.italianDayName(),
        direction: 'previous',
        method
      });
    });
  }

  async loadMenu() {
    const cacheKey = `menu-${this.menuWeekNumber()}-${this.dayOfWeekNumber()}`;
    const startedAt = Date.now();
    const course = this.italianDayName();

    try {
      const cachedMenu = this.readCache(cacheKey);
      if (cachedMenu) {
        try {
          const parsed = JSON.parse(cachedMenu) as Partial<DailyMenu>;
          const validMenu = Array.isArray(parsed.primi_piatti) &&
            Array.isArray(parsed.secondi_piatti) &&
            Array.isArray(parsed.contorni) &&
            Array.isArray(parsed.alternative_variabili);
          if (validMenu && parsed.date === new Date().toLocaleDateString()) {
            this.menu.set(parsed as DailyMenu);
            this.defineQuantityCourses();
            this.createMenu();
            this.loading.set(false);
            this.error.set(false);
            this.analytics.menuLoaded({ source: 'cache', course, durationMs: Date.now() - startedAt });
            return;
          }
        } catch {
          // Discard an invalid entry and recover by requesting a fresh menu.
        }
        this.removeCache(cacheKey);
      }

      const value = await this.appwrite.getMenu(this.menuWeekNumber(), this.dayOfWeekNumber());
      if (!value) {
        throw new Error(`No menu found for week ${this.menuWeekNumber()}, day ${this.dayOfWeekNumber()}`);
      }
      this.menu.set(value);
      this.defineQuantityCourses();
      this.createMenu();
      this.writeCache(cacheKey, JSON.stringify(value));
      this.loading.set(false);
      this.error.set(false);
      this.analytics.menuLoaded({ source: 'network', course, durationMs: Date.now() - startedAt });
    } catch (err) {
      console.error('Error fetching menu:', err);
      this.menu.set(null);
      this.loading.set(false);
      this.error.set(true);
      this.analytics.menuError({ course });
    }
  }

  handleWeekend() {
    this.weekend.set(this.dayOfWeekNumber() > 4)
  }

  getMenuWeekNumber(): number {
    const anchor = new Date(`${menuCycle.anchorDate}T00:00:00`);
    const date = this.displayDate();
    const anchorUtc = Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    const dateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const elapsedWeeks = Math.floor((dateUtc - anchorUtc) / (7 * 86400000));
    return ((menuCycle.anchorWeek + elapsedWeeks) % 4 + 4) % 4;
  }

  retryLoadMenu(): void {
    this.loading.set(true);
    this.error.set(false);
    void this.loadMenu();
  }

  getDayOfWeek(date: Date = new Date()): number {
    // JS getDay() returns: Sunday=0, Monday=1, ... Saturday=6
    const jsDay = date.getDay();
    // Convert so that Monday=0, Tuesday=1, ..., Sunday=6
    return (jsDay + 6) % 7;
  }



  getItalianDayName(date: Date = new Date()): string {
    const giorni = [
      'Lunedì',     // 0
      'Martedì',    // 1
      'Mercoledì',  // 2
      'Giovedì',    // 3
      'Venerdì',    // 4
      'Sabato',     // 5
      'Domenica'    // 6
    ];

    const index = (date.getDay() + 6) % 7; // shift so Monday=0
    return giorni[index];
  }

  private defineQuantityCourses() {
    this.num_primi.set(this.menu()?.primi_piatti.length!);
    this.num_secondi.set(this.menu()?.secondi_piatti.length!);
    this.num_contorni.set(this.menu()?.contorni.length!);
  }

  onGuideToggled(open: boolean) {
    this.analytics.guideToggled({ open, courses: this.coursesCreator().length });
  }

  onPointerDown(event: PointerEvent) {
    if (this.showSwipeHint()) {
      this.dismissSwipeHint('tap');
    }
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.tracking = true;
  }

  dismissSwipeHint(via: 'tap' | 'swipe' = 'tap') {
    if (!this.showSwipeHint()) {
      return;
    }

    this.writeCache('swipe-hint-seen', 'true');
    this.showSwipeHint.set(false);
    this.analytics.swipeHintDismissed({ via });
  }

  onPointerUp(event: PointerEvent) {
    if (!this.tracking) return;
    this.tracking = false;

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;
    const minDistance = 60; // un po' meno rigido su mobile

    if (Math.abs(deltaY) > Math.abs(deltaX)) return; // scroll verticale
    if (Math.abs(deltaX) < minDistance) return;

    if (deltaX < 0) {
      this.nextDay('swipe');
    } else {
      this.previousDay('swipe');
    }
  }

  /**
   * The flat label arrays are ordered [primi, secondi, contorni, variabili],
   * so the merged "Secondi" card draws from two non-contiguous ranges: the
   * secondi slice and the trailing variabili slice. Taking a single slice
   * would pick up the contorni labels instead of the variabili ones.
   */
  private labelsForSecondi(): CourseSection['meat_label'] {
    const labels = this.menu()?.meat_label;
    if (!labels) return [];
    return [
      ...labels.slice(this.num_primi(), this.num_primi() + this.num_secondi()),
      ...labels.slice(this.num_primi() + this.num_secondi() + this.num_contorni())
    ];
  }

  private fishLabelsForSecondi(): CourseSection['fish_label'] {
    const labels = this.menu()?.fish_label;
    if (!labels) return [];
    return [
      ...labels.slice(this.num_primi(), this.num_primi() + this.num_secondi()),
      ...labels.slice(this.num_primi() + this.num_secondi() + this.num_contorni())
    ];
  }

  private veganLabelsForSecondi(): CourseSection['vegan_label'] {
    const labels = this.menu()?.vegan_label;
    if (!labels) return [];
    return [
      ...labels.slice(this.num_primi(), this.num_primi() + this.num_secondi()),
      ...labels.slice(this.num_primi() + this.num_secondi() + this.num_contorni())
    ];
  }

  private createMenu() {
    this.coursesCreator.set([
      {
        id: 'primi',
        title: 'Primi',
        icon: '🍝',
        dishes: this.menu()?.primi_piatti!,
        meat_label: this.menu()?.meat_label!.slice(0, this.num_primi())!,
        fish_label: this.menu()?.fish_label!.slice(0, this.num_primi())!,
        vegan_label: this.menu()?.vegan_label!.slice(0, this.num_primi())!,
      },
      {
        id: 'secondi',
        title: 'Secondi',
        icon: '🍖',
        dishes: [
          ...(this.menu()?.secondi_piatti ?? []),
          ...(this.menu()?.alternative_variabili ?? [])
        ],
        meat_label: this.labelsForSecondi(),
        fish_label: this.fishLabelsForSecondi(),
        vegan_label: this.veganLabelsForSecondi(),
      },
      {
        id: 'contorni',
        title: 'Contorni',
        icon: '🥗',
        dishes: this.menu()?.contorni!,
        meat_label: this.menu()?.meat_label!.slice(this.num_primi() + this.num_secondi(), this.num_primi() + this.num_secondi() + this.num_contorni())!,
        fish_label: this.menu()?.fish_label!.slice(this.num_primi() + this.num_secondi(), this.num_primi() + this.num_secondi() + this.num_contorni())!,
        vegan_label: this.menu()?.vegan_label!.slice(this.num_primi() + this.num_secondi(), this.num_primi() + this.num_secondi() + this.num_contorni())!,
      },
      // {
      //   title: 'Piatto dello Chef',
      //   icon: '⭐',
      //   dishes: [this.menu()?.piatto_dello_chef!],
      //   meat_label: this.menu()?.meat_label!.slice(this.num_primi() + this.num_secondi() + this.num_contorni(), this.num_primi() + this.num_secondi() + this.num_contorni() + 1)!,
      //   fish_label: this.menu()?.fish_label!.slice(this.num_primi() + this.num_secondi()+ this.num_contorni(), this.num_primi() + this.num_secondi() + this.num_contorni() + 1)!,
      //   vegan_label: this.menu()?.vegan_label!.slice(this.num_primi() + this.num_secondi()+ this.num_contorni(), this.num_primi() + this.num_secondi() + this.num_contorni() + 1)!,
      // },
      {
        id: 'dessert',
        title: 'Dessert',
        icon: '🍰',
        dishes: [
          'Frutta di stagione',
          'Frutta secca',
          'Polpa di frutta',
          'Snack dolce',
          'Yogurt',
          'Budino vaniglia o cioccolato'
        ],
        meat_label: [false, false, false, false, false, false, false, false, false, false, false, false],
        fish_label: [false, false, false, false, false, false, false, false, false, false, false, false],
        vegan_label: [false, false, false, false, false, false, false, false, false, false, false, false],
      }
    ])
  }

}
