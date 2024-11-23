import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let dbInstance = null;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await open({
      filename: './marketing_optimizations.db',
      driver: sqlite3.Database
    });
  }
  return dbInstance;
}

export const db = {
  async all(query, params = []) {
    const dbConn = await getDb();
    return await dbConn.all(query, params);
  },

  async get(query, params = []) {
    const dbConn = await getDb();
    return await dbConn.get(query, params);
  },

  async run(query, params = []) {
    const dbConn = await getDb();
    return await dbConn.run(query, params);
  }
};