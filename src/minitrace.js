const matcher = /\[([^\[\]]+)\]/g

function randomInArray(arr) { return arr[Math.floor(Math.random() * arr.length)] }

export default function generate(concept, concepts, maxCycles = 10, seen = {}) {
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
      return generate(nextConcept, concepts, maxCycles, nextSeen)
    })
}
