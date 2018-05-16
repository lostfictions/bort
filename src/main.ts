require("source-map-support").install();

import { makeDiscordBot } from './clients/discord'
import { makeCLIBot } from './clients/cli'
import { createServer } from './components/server'
import {
  USE_CLI,
  PORT,
  DISCORD_TOKEN
} from './env'

if(USE_CLI) {
  makeCLIBot()
}
else {
  createServer(PORT)

  if(DISCORD_TOKEN.length > 0) {
    const discordBot = makeDiscordBot(DISCORD_TOKEN)
    discordBot.login()
  }
}
