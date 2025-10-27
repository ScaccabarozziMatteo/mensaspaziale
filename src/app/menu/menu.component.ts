import { Component, OnInit, signal } from '@angular/core';
import { AppwriteService } from '../../lib/appwrite';
import { DailyMenu } from '../models/menu.model';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  menu = signal<DailyMenu|null>(null);
  italianDayName = signal<string>('')
  loading = true;
  menuWeekNumber = 0;
  private dayOfWeekNumber = 0;

  constructor(private appwrite: AppwriteService) { }

  ngOnInit(): void {
    this.menuWeekNumber = this.getWeekNumber()
    this.dayOfWeekNumber = this.getDayOfWeek()
    this.italianDayName.set(this.getItalianDayName())
    
    console.log("Menù week number: " + this.menuWeekNumber)
    console.log("Day of week number: " + this.dayOfWeekNumber)
    
    this.getMenuWeekNumber()
    this.loadMenu();
  }

  async loadMenu() {
    try {
      this.menu.set(await this.appwrite.getMenu(this.menuWeekNumber, this.dayOfWeekNumber))
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      this.loading = false;
      console.log(this.menu())
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

}
