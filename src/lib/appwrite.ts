import { Injectable } from '@angular/core';
import { Client, TablesDB, Query } from 'appwrite';
import { DailyMenu } from '../app/models/menu.model';
import { projectId, endpoint, tablesDB, tables } from '../../appwrite.config.json';

@Injectable({
  providedIn: 'root'
})
export class AppwriteService {
  private client = new Client();
  private tablesDB: TablesDB;

  private readonly databaseID = tablesDB[0].$id;
  private readonly menuTableID = tables[2].$id;

  constructor() {
    this.client
      .setEndpoint(endpoint)
      .setProject(projectId);

    this.tablesDB = new TablesDB(this.client);
  }

  /**
   * 
   * @param week Number of the week - 0 to 3
   * @param weekday Number of the week day - 0 is Monday
   * @returns 
   */
  async getMenu(week: number, weekday: number): Promise<DailyMenu | null> {
    const result = await this.tablesDB.listRows({
      databaseId: this.databaseID,
      tableId: this.menuTableID,
      queries: [
        Query.between("week", week, week),
        Query.between("day", weekday, weekday),
        Query.limit(2),
      ]
    });
    const rawMenu = result.rows[0];
    if (!rawMenu) return null;
    if (result.rows.length > 1) {
      throw new Error(`Multiple menu rows found for week ${week}, day ${weekday}`);
    }

    return new DailyMenu(
      rawMenu.$id,
      rawMenu.week,
      rawMenu.day,
      rawMenu.primi_piatti ?? [],
      rawMenu.secondi_piatti ?? [],
      rawMenu.piatto_dello_chef ?? '',
      rawMenu.contorni ?? [],
      rawMenu.alternative_variabili ?? [],
      new Date().toLocaleDateString(),
      rawMenu.meat_label ?? [],
      rawMenu.fish_label ?? [],
      rawMenu.vegan_label ?? []
    );
  }
}

