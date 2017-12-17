import { DataStore } from '@slack/client'

// based on https://github.com/bocoup/chatter/blob/master/src/slack/util/message-parser.js

// Parse message strings per https://api.slack.com/docs/formatting
// Turns a string like this:
//   Hello <@U03BS5P65>, channel is <#C025GMFDX> and URL is <http://foo.com/bar|foo.com/bar>
// Into this:
//   Hello @cowboy, channel is #general and URL is http://foo.com/bar
export function parseMessage(dataStore : DataStore, message : string) : string {
  const handlers : { [prefix : string] : (id : string) => string } = {
    '#': id => {
      const channel = dataStore.getChannelById(id)
      if(channel) {
        return `#${channel.name}`
      }
      return `{ channel not found: '${id}' }`
    },
    '@': id => {
      const user = dataStore.getUserById(id)
      if(user) {
        return `@${user.name}`
      }
      return `{ user not found: '${id}' }`
    }
  }

  const firstPart = (s : string) => s.split('|')[0]

  return message.replace(/<([^\s>]+)>/g, (_, text) => {
    const prefix = text[0]
    const handler = handlers[prefix]
    if(handler) {
      return handler(firstPart(text.slice(1)))
    }
    return firstPart(text)
  })
}
