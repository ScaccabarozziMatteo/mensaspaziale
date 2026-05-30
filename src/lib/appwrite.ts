import { Injectable } from '@angular/core';
import { Client, TablesDB, Query } from 'appwrite';
import { DailyMenu } from '../app/models/menu.model';
import { projectId, endpoint, tablesDB, tables } from '../../appwrite.config.json'

@Injectable({
  providedIn: 'root'
})
export class AppwriteService {
  private client = new Client();
  private tablesDB: TablesDB;

  private databaseID = tablesDB[0].$id;
  private menu_collection_ID = tables[1].$id;

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
  async getMenu(week: number, weekday: number) {
    const result: any = this.tablesDB.listRows({
      databaseId: this.databaseID,
      tableId: this.menu_collection_ID,
      queries: [
        Query.between("week", week, week),
        Query.between("day", weekday, weekday),
      ]
    }
    ).then(res => {
      const rawMenu = res.rows[0];
      return new DailyMenu(rawMenu.$id, rawMenu.week, rawMenu.day, rawMenu.primi_piatti, rawMenu.secondi_piatti, rawMenu.piatto_dello_chef, rawMenu.contorni, rawMenu.alternative_variabili, new Date().toLocaleDateString(), rawMenu.meat_label, rawMenu.fish_label, rawMenu.vegan_label)   
    })
    return result
  }
}

