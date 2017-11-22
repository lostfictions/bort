import { makeSlackBot } from './clients/slack'
import { makeDiscordBot } from './clients/discord'
import { makePeerioBot } from './clients/peerio'
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

  if(env.PEERIO_USERNAME.length > 0 && env.PEERIO_ACCOUNT_KEY.length > 0) {
    const peerioBot = makePeerioBot(botName, env.PEERIO_USERNAME, env.PEERIO_ACCOUNT_KEY)
    peerioBot.login()
  }
}
