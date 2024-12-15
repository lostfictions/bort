import { join } from "path";

import level from "level";

let dbName = process.argv[2];

if (!dbName) {
  dbName = "_cli-test";
  console.warn(`no db name provided, using "${dbName}" instead`);
}

const db = level(join(import.meta.dirname, "../persist/db", dbName));

(async () => {
  for await (const data of db.createReadStream()) {
    console.log(data.key, "=", data.value);
  }
})()
  .then(() => console.log("done."))
  .catch((e) => {
    throw e;
  });
