import fs from "fs";
import path from "path";

import level from "level";

import { DATA_DIR } from "../env";

const invalidDbNameRegex = /[^a-z0-9_-]+/i;
const dbNameReplacementRegex = /[^a-z0-9_-]/gi;
export function replaceDbName(dbName: string): string {
  return dbName.replace(dbNameReplacementRegex, "_");
}

interface Action {
  type: string;
}

export type Reducer<S = any> = (state: S, action: Action) => S;

interface StoreConfig<T> {
  dbName: string;
  reducerTree: { [key in keyof T]: Reducer<T[key]> };
  defaultData: { [key in keyof T]: T[key] };
}

export interface IReadableStore<T> {
  get<K extends keyof T>(key: K): Promise<T[K]>;
}

export class Store<T> implements IReadableStore<T> {
  readonly db: level.LevelUp;
  readonly reducerTree: { [key in keyof T]: Reducer<T[key]> };

  /**
   * A Promise we can await on to know when the store is ready to use.
   */
  initializer: Promise<void> | null = null;

  constructor({ dbName, reducerTree, defaultData }: StoreConfig<T>) {
    this.reducerTree = reducerTree;

    if (invalidDbNameRegex.test(dbName)) {
      throw new Error(`Invalid db name! Permitted characters: [a-zA-Z0-9_-]`);
    }

    const dbPath = Store.getEnsuredDbPath(dbName);

    let shouldInitialize = false;
    if (fs.existsSync(dbPath)) {
      const stat = fs.statSync(dbPath);
      if (!stat.isDirectory()) {
        throw new Error(`File exists at DB path, but it's not a directory!`);
      }
      console.log(`DB exists at path '${dbPath}', opening...`);
    } else {
      console.log(`No DB exists at path '${dbPath}', creating...`);
      shouldInitialize = true;
    }

    this.db = level(dbPath, { valueEncoding: "json" });
    if (shouldInitialize) {
      const puts = Object.entries(defaultData).map(([key, val]) =>
        this.db.put(key, val).then(() => {
          console.log(`Initialized "${key}" in DB with default values.`);
        })
      );
      this.initializer = Promise.all(puts).then(() => {
        console.log("Finished initializing DB.");
      });
    }
  }

  /** Dispatch a Redux-style action to be handled by our reducer tree. */
  dispatch = async (action: Action): Promise<void> => {
    for (const [key, reducer] of Object.entries<Reducer>(this.reducerTree)) {
      let state: unknown;
      try {
        state = await this.db.get(key);
      } catch (e) {
        console.warn(`Can't get key "${key}" from DB:\n${e}`);
        return;
      }

      const nextState = reducer(state, action);
      if (nextState !== state) {
        await this.db.put(key, nextState);
      }
    }
  };

  get = <K extends keyof T>(key: K): Promise<T[K]> => this.db.get(key);

  private static readonly dbBasePath = path.join(DATA_DIR, "db");
  private static getEnsuredDbPath(dbName: string): string {
    if (!fs.existsSync(DATA_DIR)) {
      throw new Error(`Invalid data dir! "${DATA_DIR}"`);
    }
    const dbBasePathExists = fs.existsSync(this.dbBasePath);
    if (!dbBasePathExists) {
      fs.mkdirSync(this.dbBasePath);
    } else if (!fs.statSync(this.dbBasePath).isDirectory()) {
      throw new Error(
        `DB base path exists at "${this.dbBasePath}", but is not a directory!`
      );
    }

    return path.join(this.dbBasePath, dbName);
  }
}
