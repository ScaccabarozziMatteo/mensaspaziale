import { Injectable } from '@angular/core';
import { Client, TablesDB, Query } from 'appwrite';
import { DailyMenu } from '../app/models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class AppwriteService {
  private client = new Client();
  private tablesDB: TablesDB;

  private databaseID = "68fc9c4a00261282e43d"
  private menu_collection_ID = "week1"

  constructor() {
    this.client
      .setEndpoint('https://fra.cloud.appwrite.io/v1')
      .setProject('68fc98fb001d33ecc5b5');

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
      return new DailyMenu(rawMenu.$id, rawMenu.week, rawMenu.day, rawMenu.primi_piatti, rawMenu.secondi_piatti, rawMenu.piatto_dello_chef, rawMenu.contorni, rawMenu.alternative_variabili)   
    })
    return result
  }
}

