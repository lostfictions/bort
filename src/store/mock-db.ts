import { DB } from "./get-db";

export default function makeMockDb(): {
  store: { [key: string]: any };
  db: DB;
} {
  const store = {} as { [key: string]: any };

  return {
    store,
    db: {
      async get<T = any>(key: string): Promise<T> {
        if (!(key in store)) {
          // eslint-disable-next-line no-throw-literal, @typescript-eslint/no-throw-literal
          throw { notFound: true };
        }
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
