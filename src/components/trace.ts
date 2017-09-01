import { randomInRange } from '../util/util'
import { ConceptBank } from '../commands/concepts'

export const matcher = /\[([^\[\]]+)\]/g

type ModifierList = {
  [filterName : string] : (token: string, ...args : any[]) => string
}

type TraceArgs = {
  concepts : ConceptBank
  concept : string
  maxCycles? : number
  seen? : { [seen : string] : number }
  modifierList? : ModifierList
}

const isVowel = (char : string) => /^[aeiou]$/i.test(char)

export const defaultModifiers : ModifierList = {
  s: word => {
    if(word.length < 1) return word
    switch(word[word.length - 1].toLowerCase()) {
      case 's':
      case 'h':
      case 'x':
        return word + 'es'
      case 'y':
        return !isVowel(word[word.length - 2])
          ? word.substring(0, word.length - 1) + 'ies'
          : word + 's'
      default:
        return word + 's'
    }
  },
  a: word => {
    switch(true) {
      case word.length < 1:
        return word
      case word[0].toLowerCase() === 'u' && word.length > 2 && word[2].toLowerCase() === 'i':
        return 'a ' + word
      case isVowel(word[0]):
        return 'an ' + word
      default:
        return 'a ' + word
    }
  },
  ed : s => {
    if(s.length < 1) return s
    switch(s[s.length - 1]) {
      case 'e':
        return s + 'd'
      case 'y':
        return s.length > 1 && !isVowel(s[s.length - 2])
          ? s.substring(0, s.length - 1) + 'ied'
          : s + 'd'
      default:
        return s + 'ed'
    }
  }
}

defaultModifiers['an'] = defaultModifiers['a']
defaultModifiers['es'] = defaultModifiers['s']


export default function trace({
  concepts,
  concept,
  maxCycles = 10,
  seen = {},
  modifierList = defaultModifiers
} : TraceArgs) : string {
  const [resolvedConcept, ...modifierNames] = concept.split('|')
  if(!concepts.has(resolvedConcept)) {
    return `{error: unknown concept "${resolvedConcept}"}`
  }
  const traceResult = randomInRange(concepts.get(resolvedConcept))
    .replace(matcher, (_, nextConcept) => {
      if(seen[nextConcept] > maxCycles) {
        return '{error: max cycles exceeded}'
      }
      const nextSeen = Object.assign({}, seen)
      nextSeen[nextConcept] = nextSeen[nextConcept] + 1 || 1
      return trace({
        concepts,
        concept: nextConcept,
        maxCycles,
        seen: nextSeen
      })
    })
  return modifierNames.reduce(
    (result, m) => (modifierList[m] || (a => a))(result),
    traceResult
  )
}

export function tryTrace(message : string, concepts : ConceptBank) : string | false {
  if(matcher.test(message)) {
    return message.replace(matcher, (_, concept) => trace({concepts, concept: concept}))
  }
  return false
}
