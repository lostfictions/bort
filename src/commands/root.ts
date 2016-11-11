import { createArgsAdjuster, createCommand } from 'chatter'

import { AdjustedArgs } from './AdjustedArgs'

import buseyCommand from './busey'
import uptimeCommand from './uptime'
import {
  imageSearchCommand,
  gifSearchCommand
} from './images'
import gifcitiesCommand from './gifcities'
import heathcliffCommand from './heathcliff'

import {
  conceptAddCommand,
  conceptRemoveCommand,
  conceptListCommand,
  conceptMatcher
} from './concepts'

import { getSentence } from '../components/markov'
import trace, { matcher as traceMatcher } from '../components/trace'

import { addSentenceAction } from '../actions/markov'


import { Store } from 'redux'
import { BortStore } from '../store/store'


const subCommands = [
  conceptAddCommand,
  conceptRemoveCommand,
  conceptListCommand,
  buseyCommand,
  heathcliffCommand,
  imageSearchCommand,
  gifSearchCommand,
  gifcitiesCommand,
  uptimeCommand
]

const helpCommand = createCommand(
  {
    name: 'list',
    aliases: ['help', 'usage']
  },
  (_ : never, { store } : AdjustedArgs) : string => {

    const concepts = store.getState().get('concepts').keySeq().toJS()

    return '*Commands:*\n' +
      subCommands.map(c => `> *${c.name}* - ${c.description}`).join('\n') + '\n' +
      '*Listens:*\n> ' +
      concepts.filter((c : string) => c.startsWith('!')).join(', ') + '\n' +
      '*Concepts:*\n> ' +
      concepts.filter((c : string) => !c.startsWith('!')).join(', ')
  }
)

const makeRootCommand = ({ store, name } : AdjustedArgs) => createArgsAdjuster(
  {
    adjustArgs: (message : string) => [message, { store, name }]
  },
  [
    ...subCommands,
    conceptMatcher,
    helpCommand,
    // If we match nothing, check if we can trace! if not, just return a markov sentence
    (message : string, { store } : AdjustedArgs) : string => {

      const state = store.getState()
      const wb = state.get('wordBank')
      if(message.length > 0) {
        if(traceMatcher.test(message)) {
          return message.replace(traceMatcher, (_, concept) => trace(state.get('concepts'), concept))
        }

        const words = message.trim().split(' ').filter(w => w.length > 0)
        if(words.length > 0) {
          const word = words[words.length - 1]
          if(wb.has(word)) {
            return getSentence(wb, word)
          }
        }
      }
      return getSentence(wb)
    }
  ]
)

export default (store : Store<BortStore>, name : string, isDM : boolean) : {} => {

  const rootCommand = makeRootCommand({ store, name })

  const handleDirectConcepts = (message : string) : string | false => {
    if(!message.startsWith('!')) {
      return false
    }
    const concepts = store.getState().get('concepts')
    const matchedConcept = concepts.get(message)
    if(matchedConcept != null && matchedConcept.size > 0) {
      return trace(concepts, message)
    }
    return false
  }

  // If it's a DM, don't require prefixing with the bot
  // name and don't add any input to our wordbank.

  // Handling the direct concepts first should be safe --
  // it prevents the markov generator fallback of the root
  // command from eating our input.
  if(isDM) {
    return [
      handleDirectConcepts,
      rootCommand
    ]
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
