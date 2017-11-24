import { Collection } from 'immutable'

/** Returns a random number between min (inclusive) and max (exclusive). */
export function randomInt(max : number) : number
export function randomInt(min : number, max : number) : number
export function randomInt(min : number, max? : number) : number {
  if(typeof max === 'undefined') {
    max = min
    min = 0
  }
  return Math.floor(Math.random() * (max - min)) + min
}

export function randomInArray<T>(arr : T[]) : T { return arr[Math.floor(Math.random() * arr.length)] }

export function randomInRange<T>(collection : Collection.Indexed<T>) : T {
  return collection.get(Math.floor(Math.random() * collection.size))
}

export interface WeightedValues { [value : string] : number }
export function randomByWeight<T extends WeightedValues, K extends keyof T>(weights : T) : K {
  const keys = Object.keys(weights) as K[]
  const sum = keys.reduce((p, c) => p + weights[c], 0)
  const choose = Math.floor(Math.random() * sum)
  for (let i = 0, count = 0; i < keys.length; i++) {
    count += weights[keys[i]]
    if (count > choose) {
      return keys[i]
    }
  }
  throw new Error('We goofed!')
}
