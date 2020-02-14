import { DB } from "./get-store";

export default function makeMockDb(): {
  store: { [key: string]: any };
  db: DB;
} {
  const store = {} as { [key: string]: any };

  return {
    store,
    db: {
      async get<T = any>(key: string): Promise<T> {
        return store[key];
      },
      async put<T = any>(key: string, value: T): Promise<void> {
        store[key] = value;
      },
      async del(key: string): Promise<void> {
        delete store[key];
      }
    }
  };
}
