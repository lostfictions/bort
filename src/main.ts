import * as readline from 'readline'
import * as fs from 'fs'
import { hostname } from 'os'

import { env } from './env'
import * as minimist from 'minimist'
const argv = minimist(process.argv.slice(2))

import { pingserver } from './components/pingserver'
pingserver(env.OPENSHIFT_NODEJS_PORT, env.OPENSHIFT_NODEJS_IP)

import { SlackBot, createCommand, processMessage, normalizeMessage } from 'chatter'
import { RtmClient, WebClient, MemoryDataStore } from '@slack/client'


import { randomInArray } from './util/util'

import { addSentenceAction } from './actions/markov'

import { makeStore } from './store/store'

import makeRootCommand from './commands/root'

const store = makeStore()




const makeMessageHandler = (name : string, isDM : boolean) : {} => {
  // We could get our actual bot name as below, but let's override it for testing
  // const channel = meta.channel
  // const botNames = this.getBotNameAndAliases(channel.is_im)

  const rootCommand = makeRootCommand({ store, name })

  // If it's a DM, don't require prefixing with the bot
  // name and don't add any input to our wordbank:
  if(isDM) {
    return rootCommand
  }

  // Otherwise, it's a public channel message.
  return [
    createCommand(
      {
        isParent: true,
        name: name,
        // name: botNames.name,
        // aliases: botNames.aliases,
        description: `it ${name}`
      },
      rootCommand
    ),
    // (message : string) : string | false => {
    //   if(message === '!vidrand') {
    //     return randomInArray(watchlist)
    //   }
    //   return false
    // },
    // If we didn't match anything, add to our markov chain.
    (message : string) => {
      store.dispatch(addSentenceAction(message))
      return false
    }
  ]
}

if(argv['test']) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const simulate = (messageHandler : any, message : string) => processMessage(messageHandler, message)
    .then(response => {
      const text = response !== false ? normalizeMessage(response) : '-'
      console.log(text)
    })
    // .catch(reason => console.log(`Uhhh... ${reason}`))

  const testBot = makeMessageHandler('bort', true)

  rl.on('line', (input : string) => simulate(testBot, input))
}
else {
  //tslint:disable:no-invalid-this
  const bot = new SlackBot({
    name: 'bort',
    // Override the message posting options so that we simply post as our bot user
    postMessageOptions: (text : string) => ({ as_user: true, text }),
    getSlack: function(this : SlackBot) {
      const rtm = new RtmClient(env.SLACK_TOKEN, {
        dataStore: new MemoryDataStore(),
        autoReconnect: true,
        logLevel: 'error'
      })

      // Post a message to all the channels we belong to.
      const b = this
      rtm.on('open', function() : void {
        const cs = this.dataStore.channels
        Object.keys(cs)
          .filter(c => cs[c].is_member && !cs[c].is_archived)
          .forEach(c => b.postMessage(c, `${b.name} (on \`${hostname()}\`)`))
      })

      return {
        rtmClient: rtm,
        webClient: new WebClient(env.SLACK_TOKEN)
      }
    },
    createMessageHandler: function(this : SlackBot, id : any, meta : any) : any {
      return makeMessageHandler(this.name, meta.channel.is_im)
    }
  })
  //tslint:enable:no-invalid-this

  bot.login()
}
