import { env } from './env'
import * as os from 'os'

import { pingserver } from './pingserver'
pingserver(env.OPENSHIFT_NODEJS_PORT, env.OPENSHIFT_NODEJS_IP)

import { SlackBot, createCommand } from 'chatter'
import { RtmClient, WebClient, MemoryDataStore } from '@slack/client'

import { conceptCommand } from './concepts'

//tslint:disable:no-invalid-this
const bot = new SlackBot({
  name: 'tong',
  getSlack: function() {
    const rtm = new RtmClient(env.SLACK_TOKEN, {
      dataStore: new MemoryDataStore(),
      autoReconnect: true,
      logLevel: 'error'
    })

    const bot = this as SlackBot
    rtm.on('open', function() : void {
      // Post a message to all the channels we belong to
      const cs = this.dataStore.channels
      Object.keys(cs)
        .filter(c => cs[c].is_member && !cs[c].is_archived)
        .forEach(c => bot.postMessage(c, `${bot.name} (on \`${os.hostname()}\`)`))

      // Set the bot icon to the one we configured in the integration
      bot.icon = this.dataStore.users[this.activeUserId].profile.image_original
    })

    return {
      rtmClient: rtm,
      webClient: new WebClient(env.SLACK_TOKEN)
    }
  },
  createMessageHandler: function(id : any, meta : any) : any {

    // We could get our actual bot name as below, but let's override it for testing
    // const channel = meta.channel
    // const botNames = this.getBotNameAndAliases(channel.is_im)

    const rootCommand = createCommand(
      {
        isParent: true,
        name: this.name,
        // name: botNames.name,
        // aliases: botNames.aliases,
        description: `Let's make some shit up`
      },
      [
        conceptCommand
      ]
    )

    // We could handle DMs differently:
    // if(channel.is_im) {
    //   return rootCommand
    // }

    // Otherwise, it's a public channel message.
    return [
      rootCommand
      //Optionally, we could handle ambient messages by adding them here.
    ]
  }
})
//tslint:enable:no-invalid-this

bot.login()


