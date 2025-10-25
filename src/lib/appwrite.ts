import { Injectable } from '@angular/core';
import { Client, Databases, TablesDB } from 'appwrite';

@Injectable({
  providedIn: 'root'
})
export class AppwriteService {
  private client = new Client();
  private database: Databases;

  private databaseID = "68fc9c4a00261282e43d"
  private menu_collection_ID = "week1"

  constructor() {
    this.client
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('68fc98fb001d33ecc5b5');

    this.database = new Databases(this.client);
  }

  ping() {
    this.client.ping
  }

  /*
  getMenu(week: number) {
    return this.database.getTransaction(
      this.databaseID,
      this.menu_collection_ID,
      [ `equal("week", ${week})` ]
    );
  }
    */
}
