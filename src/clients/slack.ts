import { SlackBot } from 'chatter'
import { RtmClient, WebClient, MemoryDataStore } from '@slack/client'
import { env } from '../env'

import makeMessageHandler from '../commands/root'
import { getStore } from '../store/get-store'

// import { hostname } from 'os'

// tslint:disable:no-invalid-this
export const makeSlackBot = (botName : string, slackToken : string) => new SlackBot({
  name: botName,
  // Override the message posting options so that we simply post as our bot user
  postMessageOptions: (text : string) => ({
    text,
    as_user: false,
    username: botName,
    icon_url: `http://${env.HOSTNAME}/bort.png`,
    unfurl_links: true,
    unfurl_media: true
  }),
  getSlack(this : SlackBot) { // tslint:disable-line:typedef
    const rtm = new RtmClient(slackToken, {
      dataStore: new MemoryDataStore(),
      autoReconnect: true,
      logLevel: 'error'
    })

    // Post a message to all the channels we belong to.
    // const b = this
    // rtm.on('open', function() : void {
    //   const cs = this.dataStore.channels
    //   Object.keys(cs)
    //     .filter(c => cs[c].is_member && !cs[c].is_archived)
    //     .forEach(c => b.postMessage(c, `${b.name} (on \`${hostname()}\`)`))
    // })

    return {
      rtmClient: rtm,
      webClient: new WebClient(slackToken)
    }
  },
  createMessageHandler(this : SlackBot, id : any, meta : any) : any {
    if(!this.slack.rtmClient.activeTeamId) {
      throw new Error(`Slack client: couldn't retrieve team id!`)
    }
    return makeMessageHandler(getStore(this.slack.rtmClient.activeTeamId), this.name, meta.channel.is_im)
  }
})
// tslint:enable:no-invalid-this
