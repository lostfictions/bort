import { BOT_NAME } from './env'

import { processMessage, makeCommand, Handler } from './util/handler'

import { HandlerArgs } from './handler-args'

import buseyCommand from './commands/busey'
import seenCommand from './commands/seen'
import catmakerCommand from './commands/catmaker'
import rhymeCommand from './commands/rhyme'
import weatherCommand from './commands/weather'
import uptimeCommand from './commands/uptime'
import {
  imageSearchCommand,
  gifSearchCommand
} from './commands/images'
import gifcitiesCommand from './commands/gifcities'
import completeCommand from './commands/complete'
import heathcliffCommand from './commands/heathcliff'
import wikihowCommand from './commands/wikihow'
import conceptLoadCommand from './commands/concept-load'
import {
  conceptAddCommand,
  conceptRemoveCommand,
  conceptListCommand,
  conceptMatcher
} from './commands/concepts'


import { getSentence } from './components/markov'
import trace, { matcher as traceMatcher } from './components/trace'

import { addSentenceAction } from './actions/markov'
import { setSeenAction } from './actions/seen'


const subCommands = [
  conceptAddCommand,
  conceptRemoveCommand,
  conceptLoadCommand,
  conceptListCommand,
  buseyCommand,
  seenCommand,
  rhymeCommand,
  heathcliffCommand,
  wikihowCommand,
  imageSearchCommand,
  gifSearchCommand,
  gifcitiesCommand,
  completeCommand,
  weatherCommand,
  catmakerCommand,
  uptimeCommand
]

// TODO: allow getting usage for subcommands
const helpCommand = makeCommand<HandlerArgs>(
  {
    name: 'list',
    aliases: ['help', 'usage']
  },
  ({ store }) => {

    const concepts = store.getState().get('concepts').keySeq().toJS()

    return '*Commands:*\n' +
      subCommands.map(c => `> *${c.name}* - ${c.description}`).join('\n') + '\n' +
      '*Listens:*\n> ' +
      concepts.filter((c : string) => c.startsWith('!')).join(', ') + '\n' +
      '*Concepts:*\n> ' +
      concepts.filter((c : string) => !c.startsWith('!')).join(', ')
  }
)

const rootCommand = [
  ...subCommands,
  conceptMatcher,
  helpCommand,
  // If we match nothing, check if we can trace! if not, just return a markov sentence
  ({ message, store } : HandlerArgs) : string => {

    const state = store.getState()
    const wb = state.get('wordBank')
    if(message.length > 0) {
      if(traceMatcher.test(message)) {
        return message.replace(traceMatcher, (_, concept) => trace({
          concepts: state.get('concepts'),
          concept
        }))
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
] as Handler<HandlerArgs, string>[]

const handleDirectConcepts = ({ message, store } : HandlerArgs) : string | false => {
  if(!message.startsWith('!')) {
    return false
  }
  const concepts = store.getState().get('concepts')
  const matchedConcept = concepts.get(message)
  if(matchedConcept != null && matchedConcept.size > 0) {
    return trace({concepts, concept: message})
  }
  return false
}

const setSeen = ({ username, message, store, channel } : HandlerArgs) : false => {
  store.dispatch(setSeenAction(username, message, channel))
  return false
}

const bortCommand = makeCommand<HandlerArgs>(
  {
    // isParent: true,
    name: BOT_NAME,
    // name: botNames.name,
    // aliases: botNames.aliases,
    description: `it ${BOT_NAME}`
  },
  rootCommand
)

// FIXME: is 'async' necessary here?
const messageHandler : Handler<HandlerArgs, string>[] = [
  async args => args.isDM ? false : processMessage(setSeen, args),
  // Handling the direct concepts first should be safe -- it prevents the markov
  // generator fallback of the root command from eating our input.
  handleDirectConcepts,
  // If it's a DM, don't require prefixing with the bot name and don't add any
  // input to our wordbank.
  async args => args.isDM ? processMessage(rootCommand, args) : processMessage(bortCommand, args),
  // If we didn't match anything, add to our markov chain.
  ({ message, store }) => {
    if(message.length > 0 && message.trim().split(' ').filter(s => s.length > 0).length > 1) {
      store.dispatch(addSentenceAction(message))
    }
    return false
  }
]

export default messageHandler