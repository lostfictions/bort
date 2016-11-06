import { createCommand, createMatcher, createArgsAdjuster } from 'chatter'
import { Map, List } from 'immutable'
import { Store } from 'redux'
import { BortStore } from '../store/store'

import { AdjustedArgs } from './AdjustedArgs'
import {
  addConceptAction,
  removeConceptAction,
  addToConceptAction,
  removeFromConceptAction
} from '../actions/concept'

import trace from '../components/minitrace'

export type ConceptBank = Map<string, List<string>>

// Match two groups:
// 1: a bracket-delimited term of any length
// 2: the rest of the message if there is any, ignoring any preceding whitespace
const matcher = /^\[([^\[\]]+)\](?:$|\s+(.*))/g

export const conceptAddCommand = createCommand(
  {
    name: 'add',
    aliases: ['+'],
    description: 'add a new concept'
  },
  (message : string, { store } : AdjustedArgs) : boolean | string => {
    if(message.length === 0) {
      return false
    }

    const concepts = store.getState().get('concepts')
    if(concepts.has(message)) {
      return `Concept "${message}" already exists!`
    }
    store.dispatch(addConceptAction(message))
    return `Okay! Added a concept named "${message}".`
  }
)

export const conceptRemoveCommand = createCommand(
  {
    name: 'remove',
    aliases: ['delete', '-'],
    description: 'delete an existing concept'
  },
  (message : string, { store } : AdjustedArgs) : boolean | string => {
    if(message.length === 0) {
      return false
    }

    const concepts = store.getState().get('concepts')
    if(!concepts.has(message)) {
      return `Concept "${message}" doesn't exist!`
    }
    store.dispatch(removeConceptAction(message))
    return `Okay! Deleted concept "${message}".`
  }
)

// export const conceptListCommand = createCommand(
//   {
//     name: 'list',
//     aliases: ['get'],
//     description: 'list all concepts'
//   },
//   (message : string, { store } : AdjustedArgs) => 'Concepts:\n' + Object.keys(concepts).join(', ') || 'None.'
// )

// We could probably come up with a better naming scheme, but:
// the commands above are used to add, remove and list top-level
// concepts, while the commands below add, remove and list the
// contents of individual concepts.

const conceptAddToCommand = createCommand(
  {
    name: 'add',
    aliases: ['+'],
    description: 'add to a concept'
  },
  (message : string, concept : string, store : Store<BortStore>) : boolean | string => {
    if(message.length === 0) {
      return false
    }

    const concepts = store.getState().get('concepts')
    if(concepts.get(concept).indexOf(message) !== -1) {
      return `"${message}" already exists in "${concept}"!`
    }
    store.dispatch(addToConceptAction(concept, message))
    return `Okay! Added "${message}" to "${concept}".`
  }
)

const conceptRemoveFromCommand = createCommand(
  {
    name: 'remove',
    aliases: ['delete', '-'],
    description: 'remove from a concept'
  },
  (message : string, concept : string, store : Store<BortStore>) : boolean | string => {
    if(message.length === 0) {
      return false
    }

    const concepts = store.getState().get('concepts')

    if(concepts.get(concept).indexOf(message) === -1) {
      return `"${message}" doesn't exist in "${concept}"!`
    }
    store.dispatch(removeFromConceptAction(concept, message))
    return `Okay! Removed "${message}" from "${concept}".`
  }
)

const conceptListOneCommand = createCommand(
  {
    name: 'list',
    aliases: ['get'],
    description: 'list everything in a concept'
  },
  (message : string, concept : string, store : Store<BortStore>) : string | boolean => {
    if(message.length > 0) {
      return false
    }

    const items = store.getState().get('concepts').get(concept).join(', ')
    return `*${ concept }:*\n` + (items.length > 0 ? items : 'Empty.')
  }
)

const conceptGetRandom = (message : string, concept : string, store : Store<BortStore>) : string | boolean => {
  if(message.length > 0) {
    return false
  }

  const concepts = store.getState().get('concepts')
  if(concepts.get(concept).size === 0) {
    return `Concept ${ concept } is empty!`
  }
  return trace(concepts.toJS(), concept)
}

// The conceptMatcher matches commands that start with a concept,
// adjusts the arguments to include the normalized concept in question
// and removes it from the message, and then redirects to one of the
// commands above.
export const conceptMatcher = createMatcher(
  {
    match: (message : string, { store } : AdjustedArgs) : boolean | string => {
      if(message.length === 0) {
        return false
      }

      // The matcher will match concepts/commands either in the format
      // "adj add humongous" OR "[adj] add humongous".
      // This lets us match concepts that contain whitespace
      // like "[kind of animal]", as well as concepts that might
      // otherwise be processed as a keyword or command, like "[delete]".

      // We try matching against the "matcher" regex above, then
      // normalize the results.
      let matches : string[] | null = message.match(matcher)
      if(matches == undefined) {
        const split = message.split(' ')
        matches = ['', split[0], split.slice(1).join(' ')]
      }

      const [, concept, command] = matches

      const concepts = store.getState().get('concepts')
      if(!concepts.has(concept)) {
        return false
      }
      return concept + ' ' + command
    }
  },
  createArgsAdjuster(
    {
      adjustArgs: (message : string, { store } : AdjustedArgs) => {
        const split = message.split(' ')
        const concept = split[0]
        const adjustedMessage = split.slice(1).join(' ')
        return [adjustedMessage, concept, store]
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
