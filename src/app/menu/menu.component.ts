import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { Renderer2 } from '@angular/core';
import { AppwriteService } from '../../lib/appwrite';
import { DailyMenu } from '../models/menu.model';
import { StarsDirective } from '../service/stars.directive';
import { MenuAlternativesComponent } from './menu-elements/menu-alternatives.component';
import { MenuSectionComponent } from './menu-elements/menu-section.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface CourseSection {
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
  imports: [StarsDirective, MenuSectionComponent, MenuAlternativesComponent, MatProgressSpinnerModule]

})
export class MenuComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);
  private readonly appwrite = inject(AppwriteService);

  menu = signal<DailyMenu | null>(null);
  italianDayName = signal<string>('')
  loading = signal(true);
  error = signal(false);
  weekend = signal(false);

  dayOffset = signal(0);
  displayDate = signal(new Date());

  readonly menuWeekNumber = signal(0);
  readonly dayOfWeekNumber = signal(0);
  private weekNumberOffset = 0;

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

    if (this.isMobile() && !this.storage()?.getItem('swipe-hint-seen')) {
      this.showSwipeHint.set(true);
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

    if (!this.weekend()) {
      this.loadMenu();
    }
  }

  nextDay() {
    const nextOffset = this.dayOffset() + 1;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + nextOffset);

    if (this.getDayOfWeek(futureDate) > 4) {
      return; // no weekend
    }

    this.triggerSlide('left', () => {
      this.dayOffset.set(nextOffset);
      this.loading.set(true);
      this.menu.set(null);
      this.updateDisplayDate();
    });
  }

  previousDay() {
    if (this.dayOfWeekNumber() <= 0) {
      return;
    }

    this.triggerSlide('right', () => {
      this.dayOffset.update(v => v - 1);
      this.loading.set(true);
      this.menu.set(null);
      this.updateDisplayDate();
    });
  }

  async loadMenu() {
    const storage = this.storage();
    const cacheKey = `menu-${this.menuWeekNumber()}-${this.dayOfWeekNumber()}`;

    try {
      const cachedMenu = storage?.getItem(cacheKey);

      if (cachedMenu !== null && cachedMenu !== undefined) {
        console.log('Menù presente in cache')
        const menuDate = JSON.parse(cachedMenu).date
        const today = new Date().toLocaleDateString()

        if (menuDate === today) {
          console.log('Menù aggiornato alla data corrente')
          this.menu.set(JSON.parse(cachedMenu))
          this.defineQuantityCourses();
          this.createMenu();
          this.loading.set(false)
          this.error.set(false)

        } else {
          console.log('Menù non aggiornato')
          this.menu.set(null)
        }
      }
      if (this.menu() === null) {
        console.log('Menù non presente o non aggiornato, scaricamento menù aggiornato in corso..')
        this.appwrite.getMenu(this.menuWeekNumber(), this.dayOfWeekNumber()).catch(error => {
          console.error(error);
          this.error.set(true);
          this.loading.set(false)
        }).then(value => {
          this.menu.set(value);
          this.defineQuantityCourses();
          this.createMenu();
          if (value !== undefined) {
            storage?.setItem(
              cacheKey,
              JSON.stringify(this.menu())
            );
            this.loading.set(false)
            this.error.set(false)
          }
        })
      }

    } catch (err) {
      console.error('Error fetching menu:', err);
      this.loading.set(false)
      this.error.set(true)
      // Clean storage cache
      storage?.clear()
    }
  }

  getWeekNumber(date: Date = new Date()): number {
    const currentDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = currentDate.getUTCDay() || 7;
    currentDate.setUTCDate(currentDate.getUTCDate() + 4 - dayNum);
    // Get first day of year
    const yearStart = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1));

    const weekNo = Math.ceil(((currentDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

    return weekNo;
  }

  handleWeekend() {
    this.weekend.set(this.dayOfWeekNumber() > 4)
  }

  getMenuWeekNumber(): number {
    return ((this.getWeekNumber(this.displayDate()) + this.weekNumberOffset) % 4)
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

  onPointerDown(event: PointerEvent) {
    this.dismissSwipeHint();
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.tracking = true;
  }

  dismissSwipeHint() {
    this.storage()?.setItem('swipe-hint-seen', 'true');
    this.showSwipeHint.set(false);
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
      this.nextDay();
    } else {
      this.previousDay();
    }
  }

  private createMenu() {
    this.coursesCreator.set([
      {
        title: 'Primi',
        icon: '🍝',
        dishes: this.menu()?.primi_piatti!,
        meat_label: this.menu()?.meat_label!.slice(0, this.num_primi())!,
        fish_label: this.menu()?.fish_label!.slice(0, this.num_primi())!,
        vegan_label: this.menu()?.vegan_label!.slice(0, this.num_primi())!,
      },
      {
        title: 'Secondi',
        icon: '🍖',
        dishes: this.menu()?.secondi_piatti!,
        meat_label: this.menu()?.meat_label!.slice(this.num_primi(), this.num_primi() + this.num_secondi())!,
        fish_label: this.menu()?.fish_label!.slice(this.num_primi(), this.num_primi() + this.num_secondi())!,
        vegan_label: this.menu()?.vegan_label!.slice(this.num_primi(), this.num_primi() + this.num_secondi())!,
      },
      {
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
        title: 'Alternative al Secondo',
        icon: '🧀',
        dishes: this.menu()?.alternative_variabili!,
        meat_label: this.menu()?.meat_label!.slice(this.num_primi() + this.num_secondi() + this.num_contorni())!,
        fish_label: this.menu()?.fish_label!.slice(this.num_primi() + this.num_secondi() + this.num_contorni())!,
        vegan_label: this.menu()?.vegan_label!.slice(this.num_primi() + this.num_secondi() + this.num_contorni())!,
      },
      {
        title: 'Dessert',
        icon: '🍰',
        dishes: [
          'Gelato',
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
