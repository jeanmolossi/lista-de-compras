import * as SQLite from 'expo-sqlite';

type StatementParam = string | number | null;

let database: SQLite.SQLiteDatabase | null = null;
let operationQueue: Promise<void> = Promise.resolve();

const MIGRATION_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS shopping_lists (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      archived_at TEXT
    );`,
  `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY NOT NULL,
      list_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE
    );`,
  `CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY NOT NULL,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      price REAL DEFAULT 0,
      notes TEXT,
      purchased INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
    );`,
];

const ensureDatabase = async (): Promise<void> => {
  if (!database) {
    database = await SQLite.openDatabaseAsync('shopping-list.db');
    await database.execAsync('PRAGMA foreign_keys = ON;');
    for (const statement of MIGRATION_STATEMENTS) {
      await database.execAsync(statement);
    }
  }
};

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  await ensureDatabase();
  if (!database) {
    throw new Error('Banco de dados não inicializado');
  }
  return database;
};

type RunResult = Awaited<ReturnType<SQLite.SQLiteDatabase['runAsync']>>;

const runSerialized = async <T>(
  operation: (db: SQLite.SQLiteDatabase) => Promise<T>,
): Promise<T> => {
  const previousOperation = operationQueue;
  let releaseQueue: () => void = () => {};
  operationQueue = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });

  await previousOperation;

  try {
    const db = await getDatabase();
    return await operation(db);
  } finally {
    releaseQueue();
  }
};

export const runQuery = async (
  sql: string,
  ...params: StatementParam[]
): Promise<RunResult> => {
  return runSerialized((db) => db.runAsync(sql, ...params));
};

export const extractInsertId = (result: RunResult): number => {
  const payload = result as RunResult & { insertId?: number; lastInsertRowId?: number };
  const value = payload.lastInsertRowId ?? payload.insertId ?? null;
  return value != null ? Number(value) : 0;
};

export const getAll = async <T>(
  sql: string,
  ...params: StatementParam[]
): Promise<T[]> => {
  return runSerialized((db) => db.getAllAsync<T>(sql, ...params));
};

export const getFirst = async <T>(
  sql: string,
  ...params: StatementParam[]
): Promise<T | null> => {
  const results = await getAll<T>(sql, ...params);
  return results.length > 0 ? results[0] : null;
};
