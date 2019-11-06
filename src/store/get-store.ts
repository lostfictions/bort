import { makeStore, BortStore } from "./make-store";
import { cleanRecentsAction } from "../reducers/recents";

const storeCache: { [id: string]: BortStore } = {};

/**
 * Get or create a store for a given ID. If you don't want different services or
 * channels to share a store, make sure it has a unique ID!
 * @param id The unique identifier for this store.
 */
export async function getStore(id: string): Promise<BortStore> {
  if (id.length < 1) {
    throw new Error("Invalid id for store!");
  }

  if (id in storeCache) {
    return storeCache[id];
  }
  const s = await makeStore(id);

  setInterval(() => s.dispatch(cleanRecentsAction()), 60000);

  // eslint-disable-next-line require-atomic-updates
  storeCache[id] = s;
  return s;
}
