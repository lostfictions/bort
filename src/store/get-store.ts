import * as path from "path";
import * as fs from "fs";

import { Store } from "redux";
import { makeStore, BortStore } from "./store";
import { DATA_DIR } from "../env";

import { cleanRecentsAction } from "../reducers/recents";

const storeCache: { [id: string]: Store<BortStore> } = {};

/**
 * Get or create a store for a given ID. If you don't want different services or
 * channels to share a store, make sure it has a unique ID!
 * @param id The unique identifier for this store.
 */
export function getStore(id: string): Store<BortStore> {
  if (id.length < 1) {
    throw new Error("Invalid id for store!");
  }

  if (id in storeCache) {
    return storeCache[id];
  }
  const s = makeStore(id);

  // Serialize on all state changes!
  // Probably doesn't scale, but good enough for now

  // This is also reliant on the filename logic in makeStore()
  // staying the same. TODO
  s.subscribe(() => {
    const p = path.join(DATA_DIR, id + ".json");
    fs.writeFile(p, JSON.stringify(s.getState()), e => {
      if (e) {
        console.error(`Couldn't write state to ${p}: [${e}]`);
      } else {
        // console.log(`Wrote state to '${ p }'!`)
      }
    });
  });

  setInterval(() => s.dispatch(cleanRecentsAction()), 60000);

  storeCache[id] = s;
  return s;
}
