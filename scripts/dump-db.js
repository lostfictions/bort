const path = require("path");

const level = require("level");

let dbName = process.argv[2];

if (!dbName) {
  dbName = "_cli-test";
  console.warn(`no db name provided, using "${dbName}" instead`);
}

const db = level(path.join(__dirname, "../persist/db", dbName));

(async () => {
  for await (const data of db.createReadStream()) {
    console.log(data.key, "=", data.value);
  }
})()
  .then(() => console.log("done."))
  .catch(e => {
    throw e;
  });
