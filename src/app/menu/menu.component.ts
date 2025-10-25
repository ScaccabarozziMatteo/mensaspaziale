import { Component, OnInit } from '@angular/core';
import { AppwriteService } from '../../lib/appwrite';
import { DailyMenu } from '../models/menu.model';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  menu!: DailyMenu;
  loading = true;

  constructor(private appwrite: AppwriteService) {}

  ngOnInit(): void {
    this.loadMenu(4); // Example: week 4
  }

  async loadMenu(week: number) {
    try {
      //const response = await this.appwrite.getMenu(week);
      //this.menu = response.documents;
      const pingresult = this.appwrite.ping
      console.log('aaa')
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      this.loading = false;
    }
  }
}
