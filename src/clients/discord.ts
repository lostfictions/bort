import {
  Client as DiscordClient,
  Message as DiscordMessage
} from 'discord.js'

import { getStore } from '../store/get-store'
import makeMessageHandler from '../commands/root'

import { processMessage } from '../util/handler'


// tslint:disable-next-line:typedef
export function makeDiscordBot(botName : string, discordToken : string) {
  const client = new DiscordClient()

  async function onMessage(message : DiscordMessage) : Promise<false | undefined> {
    try {
      if(message.author.bot) {
        return false
      }

      // Don't respond to non-message messages.
      if(message.type !== 'DEFAULT') {
        console.log(`Discord bot: Ignoring message type "${message.type}"`)
        return false
      }

      const text = message.content
      const args = {
        client,
        message,
        user: message.author
      }

      const store = getStore(message.guild ? message.guild.id : message.channel.id)

      const messageHandler = makeMessageHandler(store, botName, message.channel.type === 'dm')

      const response = await processMessage(messageHandler, text, args)

      if(response === false) {
        return false
      }

      message.channel.sendMessage(text)
    }
    catch(error) {
      message.channel.sendMessage(`An error occurred: ${error.message}`)
    }
  }

  client.on('ready', () => {
    console.log(`Connected to Discord guilds ${
      client.guilds.array().map(g => `'${g.name}'`).join(', ')
    } as ${botName}`)
  })
  client.on('message', onMessage)
  client.on('disconnect', (ev : CloseEvent) => {
    console.log('Discord bot disconnected! reason: ' + ev.reason)
  })

  return {
    client,
    login: client.login.bind(client, discordToken) as () => Promise<string>
  }
}
