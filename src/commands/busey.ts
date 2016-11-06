import { CommandMessageHandler } from 'chatter'
import { randomInArray } from '../util/util'

import { AdjustedArgs } from './AdjustedArgs'

export default new CommandMessageHandler(
    {
      name: 'busey',
      aliases: ['acronym'],
      description: 'make buseyisms'
    },
    (message : string, { store } : AdjustedArgs) => {
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
