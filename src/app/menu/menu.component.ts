import { Component, inject, OnInit, signal } from '@angular/core';
import { AppwriteService } from '../../lib/appwrite';
import { DailyMenu } from '../models/menu.model';
import { StarsDirective } from '../service/stars.directive';
import { MenuSectionComponent } from './menu-elements/menu-section.component';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  imports: [StarsDirective, MenuSectionComponent, MatProgressSpinnerModule]

})
export class MenuComponent implements OnInit {
  menu = signal<DailyMenu | null>(null);
  italianDayName = signal<string>('')
  loading = signal(true);
  error = signal(false);
  weekend = signal(false);
  menuWeekNumber = 0;
  private dayOfWeekNumber = 0;

  private num_primi =  signal(0);
  private num_secondi = signal(0);
  private num_contorni = signal(0);

  coursesCreator!: {
    fish_label: boolean[],
    meat_label: boolean[],
    vegetarian_label: boolean[],
    title: string,
    icon: string,
    dishes: string[];
  }[];

  private appwrite = inject(AppwriteService)

  ngOnInit(): void {
    this.menuWeekNumber = this.getWeekNumber()
    this.dayOfWeekNumber = this.getDayOfWeek()
    this.italianDayName.set(this.getItalianDayName())

    console.log("Menù week number: " + this.menuWeekNumber)
    console.log("Day of week number: " + this.dayOfWeekNumber)

    // Check if today is a weekend day
    this.handleWeekend()

    this.getMenuWeekNumber()

    if (!this.weekend()) {
      this.loadMenu();
    }
  }

  async loadMenu() {
    try {
      const cachedMenu = localStorage.getItem('menu')

      if (cachedMenu !== undefined && cachedMenu !== null) {
        console.log('Menù presente in cache')
        const menuDate = JSON.parse(cachedMenu).date
        const today = new Date().toLocaleDateString()

        if (menuDate === today) {
          console.log('Menù aggiornato alla data corrente')
          this.menu.set(JSON.parse(localStorage.getItem('menu') ?? ''))
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
        this.appwrite.getMenu(this.menuWeekNumber, this.dayOfWeekNumber).catch(error => {
          console.error(error);
          this.error.set(true);
          this.loading.set(false)
        }).then(value => {
          this.menu.set(value);
          this.defineQuantityCourses();
          this.createMenu();
          if (value !== undefined) {
            localStorage.setItem('menu', JSON.stringify(this.menu()))
            this.loading.set(false)
            this.error.set(false)
          }
        })
      }

    } catch (err) {
      console.error('Error fetching menu:', err);
      this.loading.set(false)
      this.error.set(true)
    }
  }

  getWeekNumber(date: Date = new Date()): number {
    const currentDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    const dayNum = currentDate.getUTCDay() || 7;
    currentDate.setUTCDate(currentDate.getUTCDate() + 4 - dayNum);
    // Get first day of year
    const yearStart = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil(((currentDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

    return weekNo;
  }

  handleWeekend() {
    this.weekend.set(this.dayOfWeekNumber > 4)
  }

  getMenuWeekNumber() {
    this.menuWeekNumber = ((this.getWeekNumber() + 3) % 4)
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

  private createMenu() {
    this.coursesCreator = [
      {
        title: 'Primi',
        icon: '🍝',
        dishes: this.menu()?.primi_piatti!,
        meat_label: this.menu()?.meat_label!.slice(0, this.num_primi())!,
        fish_label: this.menu()?.fish_label!.slice(0, this.num_primi())!,
        vegetarian_label: this.menu()?.vegetarian_label!.slice(0, this.num_primi())!
      },
      {
        title: 'Secondi',
        icon: '🍖',
        dishes: this.menu()?.secondi_piatti!,
        meat_label: this.menu()?.meat_label!.slice(this.num_primi(), this.num_primi() + this.num_secondi())!,
        fish_label: this.menu()?.fish_label!.slice(this.num_primi(), this.num_primi() + this.num_secondi())!,
        vegetarian_label: this.menu()?.vegetarian_label!.slice(this.num_primi(), this.num_primi() + this.num_secondi())!
      },
      {
        title: 'Contorni',
        icon: '🥗',
        dishes: this.menu()?.contorni!,
        meat_label: this.menu()?.meat_label!.slice(this.num_primi() + this.num_secondi(), this.num_primi() + this.num_secondi() + this.num_contorni())!,
        fish_label: this.menu()?.fish_label!.slice(this.num_primi() + this.num_secondi(), this.num_primi() + this.num_secondi() + this.num_contorni())!,
        vegetarian_label: this.menu()?.vegetarian_label!.slice(this.num_primi() + this.num_secondi(), this.num_primi() + this.num_secondi() + this.num_contorni())!
      },
      {
        title: 'Piatto dello Chef',
        icon: '⭐',
        dishes: [this.menu()?.piatto_dello_chef!],
        meat_label: this.menu()?.meat_label!.slice(this.num_primi() + this.num_secondi() + this.num_contorni(), this.num_primi() + this.num_secondi() + this.num_contorni() + 1)!,
        fish_label: this.menu()?.fish_label!.slice(this.num_primi() + this.num_secondi()+ this.num_contorni(), this.num_primi() + this.num_secondi() + this.num_contorni() + 1)!,
        vegetarian_label: this.menu()?.vegetarian_label!.slice(this.num_primi() + this.num_secondi() + this.num_contorni(), this.num_primi() + this.num_secondi() + this.num_contorni() + 1)!
      },
      {
        title: 'Alternative Variabili',
        icon: '🧀',
        dishes: this.menu()?.alternative_variabili!,
        meat_label: this.menu()?.meat_label!.slice(this.num_primi() + this.num_secondi() + this.num_contorni() + 1)!,
        fish_label: this.menu()?.fish_label!.slice(this.num_primi() + this.num_secondi() + this.num_contorni() + 1)!,
        vegetarian_label: this.menu()?.vegetarian_label!.slice(this.num_primi()+ this.num_secondi() + this.num_contorni() + 1)!
      },
      {
        title: 'Dessert',
        icon: '🍰',
        dishes: [
          'Frutta di stagione',
          'Polpa di frutta',
          'Snack dolce',
          'Yogurt',
          'Budino vaniglia o cioccolato'
        ],
        meat_label: [false, false, false, false, false],
        fish_label: [false, false, false, false, false],
        vegetarian_label: [false, false, false, false, false]
      }
    ]
  }

}