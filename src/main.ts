import { env } from './env'

// import * as fs from 'fs'
// import * as os from 'os'

import * as express from 'express'
// import * as moment from 'moment'
// import * as _ from 'lodash'
// import * as async from 'async'

//Untyped imports
import { SlackBot, createCommand, createMatcher, createArgsAdjuster } from 'chatter'
import { RtmClient, WebClient, MemoryDataStore } from '@slack/client'

import { default as corpora } from './corpora'
import { default as trace } from './minitrace'

// const GoogleSpreadsheet = require('google-spreadsheet')
// const syllable = require('syllable')
// const pronouncing = require('pronouncing')

//Open a responder we can ping (via uptimerobot.com or similar) so the OpenShift app doesn't idle
const app = express()
app.get('/', (req, res) => {
  res.status(200).end()
})
app.listen(env.OPENSHIFT_NODEJS_PORT, env.OPENSHIFT_NODEJS_IP)

// function randomInArray<T>(arr : Array<T>) : T { return arr[Math.floor(Math.random() * arr.length)] }

const concepts : { [concept : string] : string[] } = corpora

const conceptAddCommand = createCommand(
  {
    name: 'add',
    description: 'add a new concept'
  },
  (message : string) : boolean | string => {
    if(message.length === 0) {
      return false
    }
    if(concepts.hasOwnProperty(message)) {
      return `Concept "${message}" already exists!`
    }
    concepts[message] = []
    return `Okay! Added a concept named "${message}".`
  }
)
const conceptRemoveCommand = createCommand(
  {
    name: 'remove',
    aliases: ['delete'],
    description: 'delete an existing concept'
  },
  (message : string) : boolean | string => {
    if(message.length === 0) {
      return false
    }
    if(!concepts.hasOwnProperty(message)) {
      return `Concept "${message}" doesn't exist!`
    }
    delete concepts[message]
    return `Okay! Deleted concept "${message}".`
  }
)
const conceptListCommand = createCommand(
  {
    name: 'list',
    aliases: ['get'],
    description: 'list all concepts'
  },
  (message : string) => 'Concepts:\n' + Object.keys(concepts).join(', ') || 'None.'
)

const conceptAddToCommand = createCommand(
  {
    name: 'add',
    description: 'add to a concept'
  },
  (message : string, concept : string) : boolean | string => {
    if(message.length === 0) {
      return false
    }
    if(concepts[concept].indexOf(message) !== -1) {
      return `"${message}" already exists in "${concept}"!`
    }
    concepts[concept].push(message)
    return `Okay! Added "${message}" to "${concept}".`
  }
)

const conceptRemoveFromCommand = createCommand(
  {
    name: 'remove',
    aliases: ['delete'],
    description: 'remove from a concept'
  },
  (message : string, concept : string) : boolean | string => {
    if(message.length === 0) {
      return false
    }
    const index = concepts[concept].indexOf(message)
    if(index === -1) {
      return `"${message}" doesn't exist in "${concept}"!`
    }
    concepts[concept].splice(index, 1)
    return `Okay! Removed "${message}" from "${concept}".`
  }
)
const conceptListOneCommand = createCommand(
  {
    name: 'list',
    aliases: ['get'],
    description: 'list everything in a concept'
  },
  (message : string, concept : string) : string | boolean => {
    if(message.length > 0) {
      return false
    }
    return concept + ':\n' + concepts[concept].join(', ') || 'Empty.'
  }
)

const conceptGetRandom = (message : string, concept : string) : string | boolean => {
  if(message.length > 0) {
    return false
  }
  return trace(concept, concepts)
}

const matcher = /^\[([^\[\]]+)\]\s+(.*)/g
const conceptMatcher = createMatcher(
  {
    match: (message : string) : boolean | string => {
      if(message.length === 0) {
        return false
      }
      let matches : string[] | null = message.match(matcher) //tslint:disable-line:no-null-keyword
      if(matches == undefined) {
        const split = message.split(' ')
        matches = ['', split[0], split.slice(1).join(' ')]
      }
      const [, concept, command] = matches
      if(!concepts.hasOwnProperty(concept)) {
        return false
      }
      return concept + ' ' + command
    }
  },
  createArgsAdjuster(
    {
      adjustArgs: (message : string) => {
        const split = message.split(' ')
        const concept = split[0]
        const adjustedMessage = split.slice(1).join(' ')
        return [adjustedMessage, concept]
      }
    },
    [
      conceptAddToCommand,
      conceptRemoveFromCommand,
      conceptListOneCommand,
      conceptGetRandom
    ]
  )
)

const conceptCommand = createCommand(
  {
    name: 'concept',
    description: 'give me some ideas'
  },
  [
    conceptAddCommand,
    conceptRemoveCommand,
    conceptListCommand,
    conceptMatcher
  ]
)

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

    // Public channel message.
    return [
      rootCommand
      //Optionally handle ambient messages
    ]
  }
})

bot.login()


