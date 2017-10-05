import { makeSlackBot } from './clients/slack'
import { makeDiscordBot } from './clients/discord'
import { makeCLIBot } from './clients/cli'
import { createServer } from './components/pingserver'
import { env } from './env'

createServer(env.PORT)

const botName = env.BOT_NAME

if(env.USE_CLI) {
  makeCLIBot(botName)
}
else {
  const slackBots = env.SLACK_TOKENS
    .split(',')
    .map(t => t.trim())
    .map(t => makeSlackBot(botName, t))

  slackBots.forEach(bot => bot.login())

  const discordBot = makeDiscordBot(botName, env.DISCORD_TOKEN)
  discordBot.login()
}
