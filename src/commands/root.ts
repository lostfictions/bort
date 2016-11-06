import { createArgsAdjuster, createCommand } from 'chatter'

import { AdjustedArgs } from './AdjustedArgs'

import buseyCommand from './busey'
import uptimeCommand from './uptime'

import { getSentence } from '../components/markov'
import { conceptAddCommand, conceptRemoveCommand, conceptMatcher } from './concepts'

// import { default as trace, matcher as traceMatcher } from '../components/minitrace'


const subCommands = [
    conceptAddCommand,
    conceptRemoveCommand,
    buseyCommand,
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

export default ({ store, name } : AdjustedArgs) => createArgsAdjuster(
  {
    adjustArgs: (message : string) => [message, { store, name }]
  },
  [
    ...subCommands,
    conceptMatcher,
    helpCommand,
    // If we match nothing, check if we can trace! if not, just return a markov sentence
    (message : string, { store } : AdjustedArgs) : string => {

      if(message.length > 0) {
        // if(traceMatcher.test(message)) {
        //   return message.replace(traceMatcher, (_, concept) => trace(state.concepts, concept))
        // }

        const wb = store.getState().get('wordBank')
        const words = message.trim().split(' ').filter(w => w.length > 0)
        if(words.length > 0) {
          const word = words[words.length - 1]
          if(wb.has(word)) {
            return getSentence(wb, word)
          }
        }
      }
      const wb = store.getState().get('wordBank')
      return getSentence(wb)
    }
  ]
)
