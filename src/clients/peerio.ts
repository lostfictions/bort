import { Bot } from 'chatter'

import { getStore } from '../store/get-store'
import makeMessageHandler from '../commands/root'

import { PeerioClient, MessageData } from 'icewrap'

export function makePeerioBot(botName: string, peerioUsername: string, peerioAccountKey : string) {
  const client = new PeerioClient(botName)

  //tslint:disable:no-invalid-this
  const bot = new Bot({
    createMessageHandler: function(id: any, data: MessageData): any {
      return makeMessageHandler(getStore(data.chat.id), botName, !data.chat.isChannel)
    },
    getMessageHandlerArgs: function(this: Bot, data: MessageData): any {
      if(data.message.sender.username == client.user.username) {
        return false
      }

      // Ignore system messages.
      if(data.message.systemData) {
        console.log(`Peerio bot: Ignoring system message "${data.message.systemData.action}"`)
        return false
      }

      return {
        text: data.message.text,
        args: [ data ]
      }
    },
    getMessageHandlerCacheId: function(data: MessageData) {
      return data.chat.id
    },
    sendResponse: function(data: MessageData, text: string) {
      data.chat.sendMessage(text)
    }
  })
  //tslint:enable:no-invalid-this

  client.on('message', bot.onMessage.bind(bot))

  return {
    bot,
    client,
    login: client.login.bind(client, peerioUsername, peerioAccountKey) as () => void
  }
}
