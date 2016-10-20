export function randomInArray<T>(arr : T[]) : T { return arr[Math.floor(Math.random() * arr.length)] }

export function randomByWeight(weights : { [value : string] : number }) : string {
  const keys = Object.keys(weights)
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
