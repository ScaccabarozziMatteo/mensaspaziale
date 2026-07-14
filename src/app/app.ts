import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from './menu/menu.component';
import { AnalyticsService } from './service/analyticsService';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(private analytics: AnalyticsService) {}
  protected readonly title = signal('mensaspaziale');
}
