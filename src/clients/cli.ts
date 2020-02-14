import readline from "readline";
import { processMessage } from "../util/handler";

import { getDb } from "../store/get-db";
import messageHandler from "../root-handler";

export const makeCLIBot = (dbName = "_cli-test") => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  (async () => {
    const store = await getDb(dbName);

    console.log(`Loaded store "${dbName}"`);

    for await (const message of rl) {
      try {
        const response = await processMessage(messageHandler, {
          store,
          message,
          username: "cli-user",
          channel: "cli-channel",
          isDM: false
        });

        console.log(
          response !== false
            ? response
                .split("\n")
                .map(line => `[bort] ${line}`)
                .join("\n")
            : "-"
        );
      } catch (e) {
        console.error("[ERROR]", e);
      }
    }
  })();

  return rl;
};
