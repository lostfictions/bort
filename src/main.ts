//////
//HACK: temporary
const __chatter = require('@lostfictions/chatter') // prime cache
require.cache[require.resolve('chatter')] = require.cache[require.resolve('@lostfictions/chatter')]
require('assert').equal(require('chatter'), require('@lostfictions/chatter'))
//////

import * as os from 'os'
import * as readline from 'readline'

import { env } from './env'
import * as minimist from 'minimist'
const argv = minimist(process.argv.slice(2))

import { pingserver } from './components/pingserver'
pingserver(env.OPENSHIFT_NODEJS_PORT, env.OPENSHIFT_NODEJS_IP)

import { SlackBot, createCommand, CommandMessageHandler, createParser, processMessage, normalizeMessage } from 'chatter'
import { RtmClient, WebClient, MemoryDataStore } from '@slack/client'

import { conceptCommand } from './components/concepts'
import { Markov } from './components/markov'
import { randomInArray } from './util/util'

import { tarotLines } from './data/corpora'

const markov = new Markov()
tarotLines.forEach(line => markov.addSentence(line))

const makeMessageHandler = (name : string) => {
  // We could get our actual bot name as below, but let's override it for testing
  // const channel = meta.channel
  // const botNames = this.getBotNameAndAliases(channel.is_im)

  const addToMarkovAndContinue = (message : string) => {
    markov.addSentence(message)
    return false
  }

  const getMarkov = (message : string) => markov.getSentence(message.length > 0 ? message : undefined)

  const buseyCommand = createCommand(
    {
      name: 'busey',
      aliases: ['acronym'],
      description: 'make buseyisms'
    },
    (message : string) => {
      const letters = message.toLowerCase().split('').filter(char => /[A-Za-z]/.test(char))

      const acro : string[] = []

      let lastWord : string | null = null
      for(const l of letters) {
        let candidates : string[] | null = null

        // First, try to find something that follows from our previous word
        if(lastWord) {
          candidates = Object.keys(markov.wordBank[lastWord]).filter(word => word.startsWith(l))
        }

        // Otherwise, just grab a random word that matches our letter
        if(candidates == null || candidates.length === 0) {
          candidates = Object.keys(markov.wordBank).filter(word => word.startsWith(l))
        }

        if(candidates != null && candidates.length > 0) {
          acro.push(randomInArray(candidates))
        }
      }

      // Capitalize each word and join them into a string.
      return acro.map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
    }
  )

  const subCommands = [
    conceptCommand,
    buseyCommand
  ]

  const helpCommand = createCommand(
    {
      name: 'help',
      aliases: ['usage']
    },
    () => '**Commands:**\n' + subCommands.map(c => `> *${c.name}* - ${c.description}`).join('\n')
  )

  const rootCommand = createCommand(
    {
      isParent: true,
      name: name,
      // name: botNames.name,
      // aliases: botNames.aliases,
      description: `it ${name}`
    },
    [
      ...subCommands,
      helpCommand,
      getMarkov
    ]
  )

  // We could handle DMs differently:
  // if(channel.is_im) {
  //   return rootCommand
  // }

  // Otherwise, it's a public channel message.
  return [
    rootCommand,
    addToMarkovAndContinue
    //Optionally, we could handle ambient messages by adding them here.
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

  const testBot = makeMessageHandler('bort')

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
          .forEach(c => b.postMessage(c, `${b.name} (on \`${os.hostname()}\`)`))
      })

      return {
        rtmClient: rtm,
        webClient: new WebClient(env.SLACK_TOKEN)
      }
    },
    createMessageHandler: function(this : SlackBot, id : any, meta : any) : any {
      return makeMessageHandler(this.name)
    }
  })
  //tslint:enable:no-invalid-this

  bot.login()
}
