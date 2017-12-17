require('source-map-support').install() // tslint:disable-line:no-require-imports

import { makeSlackBot } from './clients/slack'
import { makeDiscordBot } from './clients/discord'
import { makeCLIBot } from './clients/cli'
import { createServer } from './components/server'
import {
  USE_CLI,
  PORT,
  SLACK_TOKENS,
  DISCORD_TOKEN
} from './env'

if(USE_CLI) {
  makeCLIBot()
}
else {
  createServer(PORT)

  if(SLACK_TOKENS.length > 0) {
    const slackBots = SLACK_TOKENS
      .split(',')
      .map(t => t.trim())
      .map(makeSlackBot)

    slackBots.forEach(bot => bot.login())
  }

  if(DISCORD_TOKEN.length > 0) {
    const discordBot = makeDiscordBot(DISCORD_TOKEN)
    discordBot.login()
  }
}
