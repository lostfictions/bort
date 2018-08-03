import { makeStore, Store } from "./store";
import { cleanRecentsAction } from "../reducers/recents";

const storeCache: { [id: string]: Store } = {};

/**
 * Get or create a store for a given ID. If you don't want different services or
 * channels to share a store, make sure it has a unique ID!
 * @param id The unique identifier for this store.
 */
export function getStore(id: string): Store {
  if (id.length < 1) {
    throw new Error("Invalid id for store!");
  }

  if (id in storeCache) {
    return storeCache[id];
  }
  const s = makeStore(id);

  setInterval(() => s.dispatch(cleanRecentsAction()), 60000);

  storeCache[id] = s;
  return s;
}
