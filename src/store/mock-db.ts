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
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
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
        const lt = _opts?.lt;
        const gte = _opts?.gte;
        return (async function* keyIter() {
          const keys = Object.keys(store);
          for (const k of keys) {
            if (lt != null && gte != null && k < lt && k >= gte) {
              yield k;
            }
          }
        })();
      },
      createReadStream(_opts) {
        const lt = _opts?.lt;
        const gte = _opts?.gte;
        return (async function* keyIter() {
          const entries = Object.entries(store);
          for (const [key, value] of entries) {
            if (lt != null && gte != null && key < lt && key >= gte) {
              yield { key, value };
            }
          }
        })();
      },
    },
  };
}
