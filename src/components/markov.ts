import { randomInArray, randomByWeight } from '../util/util'
import { Map } from 'immutable'

export type WordBank = Map<string, Map<string, number>>

const prepositions = [
  'until', 'onto', 'of', 'into', 'out', 'except',
  'across', 'by', 'between', 'at', 'down', 'as', 'from', 'around', 'with',
  'among', 'upon', 'amid', 'to', 'along', 'since', 'about', 'off', 'on',
  'within', 'in', 'during', 'per', 'without', 'throughout', 'through', 'than',
  'via', 'up', 'unlike', 'despite', 'below', 'unless', 'towards', 'besides',
  'after', 'whereas', '\'o', 'amidst', 'amongst', 'apropos', 'atop', 'barring',
  'chez', 'circa', 'mid', 'midst', 'notwithstanding', 'qua', 'sans',
  'vis-a-vis', 'thru', 'till', 'versus', 'without', 'w/o', 'o\'', 'a\''
]

const determiners = [
  'this', 'any', 'enough', 'each', 'whatever', 'every', 'these', 'another',
  'plenty', 'whichever', 'neither', 'an', 'a', 'least', 'own', 'few', 'both',
  'those', 'the', 'that', 'various', 'either', 'much', 'some', 'else', 'no',
  'la', 'le', 'les', 'des', 'de', 'du', 'el'
]

const conjunctions = [
  'yet', 'therefore', 'or', 'while', 'nor', 'whether',
  'though', 'because', 'cuz', 'but', 'for', 'and', 'however', 'before',
  'although', 'how', 'plus', 'versus', 'not' ]

const misc = [
  'if', 'unless', 'otherwise'
]

const continueSet = new Set(prepositions.concat(determiners).concat(conjunctions).concat(misc))
const endTest = (output : string[]) => output.length > 3 && !continueSet.has(output[output.length - 1]) && Math.random() > 0.8

// const sentenceSplitter = /(?:\.|\?|\n)/ig
// const wordNormalizer = (word : string) => word.toLowerCase()
// const wordFilter = (word : string) => word.length > 0 && !word.startsWith('http://')

export function getSeed(wordBank : WordBank) : string {
  return randomInArray(wordBank.keySeq().toJS() as string[])
}

// export function getSeed(wordBank : WordBank) : string {
//   return randomInArray(Object.keys(wordBank))
// }

export function getSentence(wordBank : WordBank, seed = getSeed(wordBank)) : string {
  if(!wordBank.get(seed)) {
    return ''
  }

  let word = seed
  const sentence = [word]
  while(wordBank.has(word) && !endTest(sentence)) {
    word = randomByWeight(wordBank.get(word).toJS())
    sentence.push(word)
  }
  return sentence.join(' ')
}

// export function getSentence(wordBank : WordBank, seed = getSeed(wordBank)) : string {
//   if(!wordBank[seed]) {
//     return ''
//   }

//   let word = seed
//   const sentence = [word]
//   while(wordBank[word] && !endTest(sentence)) {
//     word = randomByWeight(wordBank[word])
//     sentence.push(word)
//   }
//   return sentence.join(' ')
// }

// export function addSentence(wordBank : WordBank, text : string) : void {
//   text.split(sentenceSplitter).forEach(line => {
//     const words = line
//       .split(' ')
//       .map(wordNormalizer)
//       .filter(wordFilter)

//     for(let i = 0; i < words.length - 1; i++) {
//       const word = words[i]
//       const nextWord = words[i + 1]

//       if(!wordBank[word]) {
//         wordBank[word] = {}
//       }

//       if(!wordBank[word][nextWord]) {
//         wordBank[word][nextWord] = 1
//       }
//       else {
//         wordBank[word][nextWord] += 1
//       }
//     }
//   })
// }
