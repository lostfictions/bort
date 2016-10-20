import { randomInArray } from '../util/util'

type Concepts = { [conceptName : string] : string[] }

export const matcher = /\[([^\[\]]+)\]/g

export default function generate(
  concepts : Concepts,
  concept : string,
  maxCycles : number = 10,
  seen : { [seen : string] : number } = {}
) : string {
  if(!concepts[concept]) {
    return `{error: unknown concept "${concept}"}`
  }
  return randomInArray(concepts[concept])
    .replace(matcher, (_, nextConcept) => {
      if(seen[nextConcept] > maxCycles) {
        return '{error: max cycles exceeded}'
      }
      const nextSeen = Object.assign({}, seen)
      nextSeen[nextConcept] = nextSeen[nextConcept] + 1 || 1
      return generate(concepts, nextConcept, maxCycles, nextSeen)
    })
}
