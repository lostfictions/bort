//////
//HACK: temporary
const __chatter = require('@lostfictions/chatter') // prime cache
require.cache[require.resolve('chatter')] = require.cache[require.resolve('@lostfictions/chatter')]
require('assert').equal(require('chatter'), require('@lostfictions/chatter'))
//////

import * as os from 'os'
import * as readline from 'readline'
import * as fs from 'fs'

import { env } from './env'
import * as minimist from 'minimist'
const argv = minimist(process.argv.slice(2))

import { pingserver } from './components/pingserver'
pingserver(env.OPENSHIFT_NODEJS_PORT, env.OPENSHIFT_NODEJS_IP)

import { SlackBot, createCommand, processMessage, normalizeMessage } from 'chatter'
import { RtmClient, WebClient, MemoryDataStore } from '@slack/client'
import * as moment from 'moment'

import { makeConceptCommand } from './components/concepts'
import { default as trace, matcher as traceMatcher } from './components/minitrace'
import { getSentence } from './components/markov'
import { randomInArray } from './util/util'

import { addSentenceAction } from './actions/markov'

import { makeStore } from './store/store'

const store = makeStore()

const watchlist = fs.readFileSync('data/vidnite_links.txt').toString().split('\n')



const makeMessageHandler = (name : string) => {
  // We could get our actual bot name as below, but let's override it for testing
  // const channel = meta.channel
  // const botNames = this.getBotNameAndAliases(channel.is_im)

  const buseyCommand = createCommand(
    {
      name: 'busey',
      aliases: ['acronym'],
      description: 'make buseyisms'
    },
    (message : string) => {
      const wb = store.getState().get('wordBank')

      const letters = message.toLowerCase().split('').filter(char => /[A-Za-z]/.test(char))

      const acro : string[] = []

      let lastWord : string | null = null
      for(const l of letters) {
        let candidates : string[] | null = null

        // First, try to find something that follows from our previous word
        if(lastWord) {
          candidates = wb.get(lastWord).keySeq().filter(word => word != null && word.startsWith(l)).toJS()
          // candidates = Object.keys().filter(word => word.startsWith(l))
        }

        // Otherwise, just grab a random word that matches our letter
        if(candidates == null || candidates.length === 0) {
          candidates = wb.keySeq().filter(word => word != null && word.startsWith(l)).toJS()
          // candidates = Object.keys(wb).filter(word => word.startsWith(l))
        }

        if(candidates != null && candidates.length > 0) {
          acro.push(randomInArray(candidates))
        }
      }

      // Capitalize each word and join them into a string.
      return acro.map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
    }
  )

  const uptimeCommand = createCommand(
    {
      name: 'uptime',
      description: 'info about ' + name
    },
    () => {
      const hostname = os.hostname()
      const uptime = moment.duration(process.uptime(), 'seconds').humanize()
      return `hi its me <@${name}> i have been here for *${uptime}* via \`${hostname}\``
    }
  )

  const subCommands = [
    // conceptCommand,
    buseyCommand,
    uptimeCommand
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
      // If we match nothing, check if we can trace! if not, just return a markov sentence
      (message : string) => {
        const state = store.getState()

        if(message.length > 0) {
          // if(traceMatcher.test(message)) {
          //   return message.replace(traceMatcher, (_, concept) => trace(state.concepts, concept))
          // }

          const words = message.trim().split(' ').filter(w => w.length > 0)
          if(words.length > 0) {
            const wb = state.get('wordBank')
            const word = words[words.length - 1]
            if(wb.has(word)) {
              return getSentence(wb, word)
            }
          }
        }
        return getSentence(state.get('wordBank'))
      }
    ]
  )

  // We could handle DMs differently:
  // if(channel.is_im) {
  //   return rootCommand
  // }

  // Otherwise, it's a public channel message.
  return [
    rootCommand,
    (message : string) : string | false => {
      if(message === '!vidrand') {
        return randomInArray(watchlist)
      }
      return false
    },
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
