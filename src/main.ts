require("source-map-support").install();

import { makeDiscordBot } from "./clients/discord";
import { makeCLIBot } from "./clients/cli";
import { USE_CLI, DISCORD_TOKEN } from "./env";

if (USE_CLI) {
  makeCLIBot();
} else if (DISCORD_TOKEN.length > 0) {
  const discordBot = makeDiscordBot(DISCORD_TOKEN);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  discordBot.login();
}
