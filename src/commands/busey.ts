import { createCommand } from 'chatter'
import { randomInArray } from '../util'

import { AdjustedArgs } from './AdjustedArgs'

import { Map } from 'immutable'

import { tryTrace } from '../components/trace'


export default createCommand(
  {
    name: 'busey',
    aliases: ['acronym'],
    description: 'make buseyisms'
  },
  (message : string, { store } : AdjustedArgs) => {
    const maybeTraced = tryTrace(message, store.getState().get('concepts'))
    let prefix = ''
    if(maybeTraced) {
      message = maybeTraced
      prefix = `(${maybeTraced})\n`
    }

    const wb = store.getState().get('wordBank')

    const letters = message.toLowerCase().split('').filter(char => /[A-Za-z]/.test(char))

    const acro : string[] = []

    let lastWord : string | null = null
    for(const l of letters) {
      let candidates : string[] | null = null

      // First, try to find something that follows from our previous word
      if(lastWord) {
        const nexts : Map<string, number> | undefined = wb.get(lastWord)
        if(nexts != null) {
          candidates = nexts.keySeq().filter(word => word != null && word.startsWith(l)).toJS()
        }
      }

      // Otherwise, just grab a random word that matches our letter
      if(candidates == null || candidates.length === 0) {
        candidates = wb.keySeq().filter(word => word != null && word.startsWith(l)).toJS()
      }

      if(candidates != null && candidates.length > 0) {
        lastWord = randomInArray(candidates)
        acro.push(lastWord)
      }
    }

    // Capitalize each word and join them into a string.
    if(acro.length > 0) {
      return prefix + acro.map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
    }
    return prefix + 'Please Inspect Senseless Sentences'
  }
)
