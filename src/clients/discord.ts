import { Client as DiscordClient, Message as DiscordMessage, User as DiscordUser } from 'discord.js'
import { Bot } from 'chatter'

import { getStore } from '../store/get-store'
import makeMessageHandler from '../commands/root'

type DiscordMeta = {
  bot : Bot
  client : DiscordClient,
  message : DiscordMessage,
  user : DiscordUser
}

export function makeDiscordBot(botName : string, discordToken : string) {

  const client = new DiscordClient()

  //tslint:disable:no-invalid-this
  const bot = new Bot({
    createMessageHandler: function(id : any, meta : DiscordMeta) : any {
      if(meta.message.guild) {
        return makeMessageHandler(getStore(meta.message.guild.id), botName, meta.message.channel.type === 'dm')
      }
      return makeMessageHandler(getStore(meta.message.channel.id), botName, meta.message.channel.type === 'dm')
    },
    getMessageHandlerArgs: function(this : Bot, message : DiscordMessage) : any {
      if(message.author.bot) {
        return false
      }
      // Ignore non-message messages.
      if(message.type !== 'DEFAULT') {
        console.log(`Discord bot: Ignoring message type "${message.type}"`)
        return false
      }

      const user = message.author
      const meta : DiscordMeta = {
        bot: this,
        client,
        message,
        user
      }
      return {
        text: message.content,
        args: [meta]
      }
    },
    getMessageHandlerCacheId: function(meta : DiscordMeta) {
      return meta.message.channel.id
    },
    sendResponse: function(message : DiscordMessage, text : string) {
      message.channel.sendMessage(text)
    }

  })
  //tslint:enable:no-invalid-this


  client.on('ready', () => {
    console.log(`Connected to Discord guilds ${client.guilds.array().map(g => `'${g.name}'`).join(', ')} as ${botName}`)
  })
  client.on('message', bot.onMessage.bind(bot))
  client.on('disconnect', (ev : CloseEvent) => {
    console.log('Discord bot disconnected! reason: ' + ev.reason)
    // setTimeout(() => discordClient.destroy().then(createDiscordBot), 10000)
  })

  return {
    bot,
    client,
    login: client.login.bind(client, discordToken) as () => Promise<string>
  }
}
