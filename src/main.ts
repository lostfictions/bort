import { makeDiscordBot } from "./clients/discord.ts";
import { makeCLIBot } from "./clients/cli.ts";
import { USE_CLI, DISCORD_TOKEN } from "./env.ts";

if (USE_CLI) {
  makeCLIBot();
} else if (DISCORD_TOKEN.length > 0) {
  const discordBot = makeDiscordBot(DISCORD_TOKEN);
  discordBot.login().catch((e: unknown) => {
    throw e;
  });
}
