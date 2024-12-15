import type { DB } from "./get-db.ts";

export default function makeMockDb(store: { [key: string]: any } = {}): {
  store: { [key: string]: any };
  db: DB;
} {
  return {
    store,
    db: {
      async get<T = any>(key: string): Promise<T> {
        // TODO [-level] replace `in` operator
        // eslint-disable-next-line no-restricted-syntax
        if (!(key in store)) {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw { notFound: true };
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return store[key];
      },
      async put(key: string, value: unknown): Promise<void> {
        store[key] = value;
      },
      async del(key: string): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
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
