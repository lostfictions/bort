import { createCommand } from 'chatter'
import { randomInArray } from '../util/util'

import { AdjustedArgs } from './AdjustedArgs'

import { Map } from 'immutable'

import { tryTrace } from '../components/trace'

import * as cmu from 'cmu-pronouncing-dictionary'

type DictNode = { [syllOrWord : string ] : DictNode | '!' }

const flipdict = require('../../data/flipdict.json') as DictNode
const syllableSet = new Set<string>(require('../../data/syllables.json'))

const trimRe = /^[^a-zA-Z]+|[^a-zA-Z]+$/g
const trimPunc = (token : string) => token.replace(trimRe, '')

/*

From Wikipedia:

A perfect rhyme is a form of rhyme between two words or phrases satisfying the
following conditions:

    The stressed vowel sound in both words must be identical, as well as any
    subsequent sounds. For example, "sky" and "high"; "skylight" and "highlight".

    The articulation that precedes the vowel in the words must differ. For
    example, "bean" and "green" is a perfect rhyme, while "leave" and "believe"
    is not.

*/

export default createCommand(
  {
    name: 'rhyme',
    aliases: ['rap'],
    description: 'bust a rhyme like you never seen / taco beats gonna make you scream'
  },
  (message : string, { store } : AdjustedArgs) : string | false => {
    const maybeTraced = tryTrace(message, store.getState().get('concepts'))
    let prefix = ''
    if(maybeTraced) {
      message = maybeTraced
      prefix = `(${maybeTraced})\n`
    }

    if(message.length === 0) {
      return false
    }

    const words = message.split(' ').map(trimPunc).filter(word => word.length > 0)
    if(words.length === 0) {
      return false
    }

    const wb = store.getState().get('wordBank')
    const reply = []

    while(words.length > 0) {
      const word = words.pop()!
      reply.unshift(getRhymeFor(word.toLowerCase()))
    }

    let replaced = reply.reduce((arr, word) => {
      if(word === '*') {
        const nexts : Map<string, number> | undefined = wb.get(arr[arr.length - 1])
        if(nexts != null) {
          word = randomInArray(nexts.keySeq().toJS())
        }
        else {
          word = randomInArray(wb.keySeq().toJS())
        }
      }
      return arr.concat(word)
    }, [] as string[]).join(' ')

    if(replaced.length === 0) {
      replaced = '¯\\_(ツ)_/¯'
    }

    return prefix + replaced
  }
)


function getRhymeFor(word : string) : string {
  const pronounciation = cmu[word] as string | undefined
  if(!pronounciation) {
    //Push a wildcard, for which we'll try to find a candidate from the wordbank in the next step.
    return '*'
  }

  let cursor = flipdict

  const syllables = pronounciation.toLowerCase().split(' ')
  while(syllables.length > 0) {
    const syll = syllables.pop()!
    const isPrimaryStress = syll.endsWith('1')

    const nextCursor = cursor[syll] as DictNode

    if(!nextCursor) {
      break
    }

    if(isPrimaryStress) {
      // grab any word from the set that's not the articulation preceding our stress
      // (if there is one)
      const preceding = syllables.pop()
      const validArticulations = Object.keys(nextCursor)
        .filter(a => a !== preceding && syllableSet.has(a))

      // if there's no valid articulations for a perfect rhyme, just pick from lower
      // in the tree.
      if(validArticulations.length > 0) {
        cursor = nextCursor[randomInArray(validArticulations)] as DictNode
      }

      while(1) {
        const wordOrSyllable = randomInArray(Object.keys(cursor))
        if(!syllableSet.has(wordOrSyllable)) {
          return wordOrSyllable
        }
        cursor = cursor[wordOrSyllable] as DictNode
      }
      break
    }

    cursor = nextCursor
  }

  return word
}

