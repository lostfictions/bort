import readline from "readline";
import { processMessage } from "../util/handler";

import { getStore } from "../store/get-store";
import messageHandler from "../root-handler";

export const makeCLIBot = (dbName = "_cli-test") => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  (async () => {
    const store = await getStore(dbName);

    console.log(`Loaded store "${dbName}"`);

    rl.on("line", (message: string) =>
      processMessage(messageHandler, {
        store,
        message,
        username: "cli-user",
        channel: "cli-channel",
        isDM: false
      })
        .then(response => {
          console.log(
            response !== false
              ? response
                  .split("\n")
                  .map(line => `[bort] ${line}`)
                  .join("\n")
              : "-"
          );
        })
        .catch(e => {
          console.error(e);
        })
    );
  })();

  return rl;
};
