require('source-map-support').install() // tslint:disable-line:no-require-imports

import { makeSlackBot } from './clients/slack'
import { makeDiscordBot } from './clients/discord'
import { makeCLIBot } from './clients/cli'
import { createServer } from './components/server'
import { env } from './env'

createServer(env.PORT)

const botName = env.BOT_NAME

if(env.USE_CLI) {
  makeCLIBot(botName)
}
else {
  if(env.SLACK_TOKENS.length > 0) {
    const slackBots = env.SLACK_TOKENS
      .split(',')
      .map(t => t.trim())
      .map(t => makeSlackBot(botName, t))

    slackBots.forEach(bot => bot.login())
  }

  if(env.DISCORD_TOKEN.length > 0) {
    const discordBot = makeDiscordBot(botName, env.DISCORD_TOKEN)
    discordBot.login()
  }
}
