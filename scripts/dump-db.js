const path = require("path");

const level = require("level");

let dbName = process.argv[2];

if (!dbName) {
  dbName = "_cli-test";
  console.warn(`no db name provided, using "${dbName}" instead`);
}

const db = level(path.join(__dirname, "../persist/db", dbName));

db.createReadStream()
  .on("data", data => {
    console.log(data.key, "=", data.value);
  })
  .on("error", err => {
    console.error("[ERROR]", err);
  })
  .on("close", () => {
    console.log("[Stream closed]");
  })
  .on("end", () => {
    console.log("[Stream ended]");
  });
