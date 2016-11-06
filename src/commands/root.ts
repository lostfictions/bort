import { createArgsAdjuster, createCommand } from 'chatter'

import { AdjustedArgs } from './AdjustedArgs'

import buseyCommand from './busey'
import uptimeCommand from './uptime'

import { getSentence } from '../components/markov'

// import { makeConceptCommand } from './concepts'
// import { default as trace, matcher as traceMatcher } from '../components/minitrace'


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
  () => '*Commands:*\n' + subCommands.map(c => `> *${c.name}* - ${c.description}`).join('\n')
)

export default ({ store, name } : AdjustedArgs) => createArgsAdjuster(
  {
    adjustArgs: (message : string) => [message, { store, name }]
  },
  [
    ...subCommands,
    helpCommand,
    // If we match nothing, check if we can trace! if not, just return a markov sentence
    (message : string, { store } : AdjustedArgs) => {
      const wb = store.getState().get('wordBank')

      if(message.length > 0) {
        // if(traceMatcher.test(message)) {
        //   return message.replace(traceMatcher, (_, concept) => trace(state.concepts, concept))
        // }

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
