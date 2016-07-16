import { env } from './env'

import { pingserver } from './pingserver'
pingserver(env.OPENSHIFT_NODEJS_PORT, env.OPENSHIFT_NODEJS_IP)

import { SlackBot, createCommand } from 'chatter'
import { RtmClient, WebClient, MemoryDataStore } from '@slack/client'

import { conceptCommand } from './concepts'


const bot = new SlackBot({
  name: 'tong',
  getSlack: () => ({
    rtmClient: new RtmClient(env.SLACK_TOKEN, {
      dataStore: new MemoryDataStore(),
      autoReconnect: true,
      logLevel: 'error'
    }),
    webClient: new WebClient(env.SLACK_TOKEN)
  }),
  createMessageHandler: function(id : any, meta : any) : any {

    // We could get our actual bot name as below, but let's override it for testing
    // const channel = meta.channel
    // const botNames = this.getBotNameAndAliases(channel.is_im) //tslint:disable-line:no-invalid-this

    const rootCommand = createCommand(
      {
        isParent: true,
        name: this.name, //tslint:disable-line:no-invalid-this
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

bot.login()


