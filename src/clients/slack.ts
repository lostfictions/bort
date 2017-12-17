import {
  RtmClient,
  WebClient,
  MemoryDataStore,
  Message,
  Channel,
  DM
} from '@slack/client'

import { HOSTNAME, BOT_NAME } from '../env'

import { parseMessage } from './parse-slack-message'

import messageHandler from '../root-handler'
import { getStore } from '../store/get-store'
import { HandlerArgs } from '../handler-args'

import { processMessage } from '../util/handler'


export const makeSlackBot = (slackToken : string) => {
  const rtmClient = new RtmClient(slackToken, {
    dataStore: new MemoryDataStore(),
    autoReconnect: true,
    logLevel: 'error'
  })
  const webClient = new WebClient(slackToken)

  const getPostOptions = (text : string) => ({
    text,
    as_user: false,
    username: BOT_NAME,
    icon_url: `http://${HOSTNAME}/bort.png`,
    unfurl_links: true,
    unfurl_media: true
  })

  let teamName = 'error-team-name-not-retrieved'

  rtmClient.on('open', () => {
    const { dataStore, activeUserId, activeTeamId } = rtmClient
    const user = dataStore.getUserById(activeUserId)
    const team = dataStore.getTeamById(activeTeamId)

    teamName = team.name

    console.log(`Connected to ${team.name} as ${user.name}.`)
  })

  async function onMessage(message : Message) : Promise<false | undefined> {
    try {
      if(message.type !== 'message'
        || message.subtype != null
        || message.attachments != null) {
        return false
      }

      // One store for the entire Slack team.
      const store = getStore(`slack-${teamName}-${rtmClient.activeTeamId}`)

      const user = rtmClient.dataStore.getUserById(message.user)
      const channelOrDM = rtmClient.dataStore.getChannelGroupOrDMById(message.channel)

      const response = await processMessage<HandlerArgs>(
        messageHandler,
        {
          store,
          message: parseMessage(rtmClient.dataStore, message.text),
          username: user.name,
          channel: (channelOrDM as Channel).name || `dm_with_${user.name}`,
          isDM: Boolean((channelOrDM as DM).is_im)
        }
      )

      if(response === false) {
        return false
      }

      webClient.chat.postMessage(message.channel, null, getPostOptions(response))
    }
    catch(error) {
      console.error(`Error in Slack client (${teamName}): '${error.message}'`)
      webClient.chat.postMessage(message.channel, null, getPostOptions((`[Something went wrong!] [${error.message}]`)))
    }
  }

  rtmClient.on('message', onMessage)

  return {
    login: () => {
      rtmClient.start()
      return new Promise<void>(res => { rtmClient.on('open', res) })
    }
  }
}
