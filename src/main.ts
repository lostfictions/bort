import { makeDiscordBot } from "./clients/discord";
import { makeCLIBot } from "./clients/cli";
import { USE_CLI, DISCORD_TOKEN } from "./env";

if (USE_CLI) {
  makeCLIBot();
} else {
  require("source-map-support").install();
  if (DISCORD_TOKEN.length > 0) {
    const discordBot = makeDiscordBot(DISCORD_TOKEN);
    discordBot.login().catch((e) => {
      throw e;
    });
  }
}
