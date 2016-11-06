import * as readline from 'readline'
import { hostname } from 'os'

import { env } from './env'
import * as minimist from 'minimist'
const argv = minimist(process.argv.slice(2))

import { pingserver } from './components/pingserver'
pingserver(env.OPENSHIFT_NODEJS_PORT, env.OPENSHIFT_NODEJS_IP)

import { SlackBot, createCommand, processMessage, normalizeMessage } from 'chatter'
import { RtmClient, WebClient, MemoryDataStore } from '@slack/client'


import { randomInRange } from './util/util'

import { addSentenceAction } from './actions/markov'

import { makeStore } from './store/store'

import makeRootCommand from './commands/root'

import trace, { matcher as traceMatcher } from './components/minitrace'


const store = makeStore()

/////////////
// Serialize on all state changes!
import * as path from 'path'
import * as fs from 'fs'
store.subscribe(() => {
  const p = path.join(env.OPENSHIFT_DATA_DIR, 'state.json')
  fs.writeFile(p, JSON.stringify(store.getState()), (e) => {
    if(e) {
      console.error(`Couldn't write state to ${ p }: [${ e }]`)
    }
    else {
      console.log(`Wrote state to '${ p }'!`)
    }
  })
})
/////////////

const makeMessageHandler = (name : string, isDM : boolean) : {} => {

  const rootCommand = makeRootCommand({ store, name })

  const handleDirectConcepts = (message : string) : string | false => {
    if(!message.startsWith('!')) {
      return false
    }
    const concepts = store.getState().get('concepts')
    const matchedConcept = concepts.get(message)
    if(matchedConcept != null && matchedConcept.size > 0) {
      return trace(concepts.toJS(), message)
    }
    return false
  }

  // If it's a DM, don't require prefixing with the bot
  // name and don't add any input to our wordbank.

  // Handling the direct concepts first should be safe --
  // it prevents the markov generator fallback of the root
  // command from eating our input.
  // if(isDM) {
  //   return [
  //     handleDirectConcepts,
  //     rootCommand
  //   ]
  // }

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
    handleDirectConcepts,
    // If we didn't match anything, add to our markov chain.
    (message : string) => {
      if(message.length > 0 && message.split(' ').length > 1) {
        store.dispatch(addSentenceAction(message))
      }
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

  const testBot = makeMessageHandler('bort', false)

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
