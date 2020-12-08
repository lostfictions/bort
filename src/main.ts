import { makeDiscordBot } from "./clients/discord";
import { makeCLIBot } from "./clients/cli";
import { runServer } from "./server";
import { isDev, USE_CLI, DISCORD_TOKEN } from "./env";

if (USE_CLI) {
  console.log("dev ", isDev);
  makeCLIBot();
} else {
  if (!isDev) require("source-map-support").install();

  void makeBotAndConnect(DISCORD_TOKEN);
}

async function makeBotAndConnect(token: string) {
  const { login } = makeDiscordBot(token);
  await login();
  await runServer();
}
