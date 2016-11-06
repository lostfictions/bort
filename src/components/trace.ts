import { randomInRange } from '../util/util'
import { ConceptBank } from '../commands/concepts'

export const matcher = /\[([^\[\]]+)\]/g

export default function trace(
  concepts : ConceptBank,
  concept : string,
  maxCycles : number = 10,
  seen : { [seen : string] : number } = {}
) : string {
  if(!concepts.has(concept)) {
    return `{error: unknown concept "${concept}"}`
  }
  return randomInRange(concepts.get(concept))
    .replace(matcher, (_, nextConcept) => {
      if(seen[nextConcept] > maxCycles) {
        return '{error: max cycles exceeded}'
      }
      const nextSeen = Object.assign({}, seen)
      nextSeen[nextConcept] = nextSeen[nextConcept] + 1 || 1
      return trace(concepts, nextConcept, maxCycles, nextSeen)
    })
}

