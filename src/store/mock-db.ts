import { DB } from "./get-db";

export default function makeMockDb(store: { [key: string]: any } = {}): {
  store: { [key: string]: any };
  db: DB;
} {
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
      },
      createKeyStream(_opts) {
        return (async function* keyIter() {
          const keys = Object.keys(store);
          for (const k of keys) {
            if (k < _opts?.lt! && k >= _opts?.gte!) {
              yield k;
            }
          }
        })();
      },
      createReadStream(_opts) {
        return (async function* keyIter() {
          const entries = Object.entries(store);
          for (const [key, value] of entries) {
            if (key < _opts?.lt! && key >= _opts?.gte!) {
              yield { key, value };
            }
          }
        })();
      },
    },
  };
}
