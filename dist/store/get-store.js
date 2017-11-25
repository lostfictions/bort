"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const store_1 = require("./store");
const env_1 = require("../env");
const recents_1 = require("../actions/recents");
const storeCache = {};
/**
 * Get or create a store for a given ID. If you don't want different services or
 * channels to share a store, make sure it has a unique ID!
 * @param id The unique identifier for this store.
 */
function getStore(id) {
    if (id.length < 1) {
        throw new Error('Invalid id for store!');
    }
    if (id in storeCache) {
        return storeCache[id];
    }
    const s = store_1.makeStore(id);
    // Serialize on all state changes!
    // Probably doesn't scale, but good enough for now
    // This is also reliant on the filename logic in makeStore()
    // staying the same. TODO
    s.subscribe(() => {
        const p = path.join(env_1.env.DATA_DIR, id + '.json');
        fs.writeFile(p, JSON.stringify(s.getState()), (e) => {
            if (e) {
                console.error(`Couldn't write state to ${p}: [${e}]`);
            }
            else {
                // console.log(`Wrote state to '${ p }'!`)
            }
        });
    });
    setInterval(() => s.dispatch(recents_1.cleanRecentsAction()), 60000);
    storeCache[id] = s;
    return s;
}
exports.getStore = getStore;
//# sourceMappingURL=get-store.js.map