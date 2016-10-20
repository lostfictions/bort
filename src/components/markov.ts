import { randomInArray, randomByWeight } from '../util/util'

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

export class Markov {
  wordBank : { [word : string] : { [nextWord : string] : number } } = {}
  sentenceSplitter : RegExp = /(?:\.|\?|\n)/ig
  wordNormalizer : (word : string) => string = (word) => word.toLowerCase()
  wordFilter : (word : string) => boolean = (word) => word.length > 0 && !word.startsWith('http://')
  endTest : (output : string[]) => boolean =
    (output) => output.length > 3 && !continueSet.has(output[output.length - 1]) && Math.random() > 0.8

  getSeed() : string {
    return randomInArray(Object.keys(this.wordBank))
  }

  getSentence(seed = this.getSeed()) : string {
    if(!this.wordBank[seed]) {
      return ''
    }

    let word = seed
    const sentence = [word]
    while(this.wordBank[word] && !this.endTest(sentence)) {
      word = randomByWeight(this.wordBank[word])
      sentence.push(word)
    }
    return sentence.join(' ')
  }

  addSentence(text : string) : void {
    text.split(this.sentenceSplitter).forEach(line => {
      const words = line
        .split(' ')
        .map(this.wordNormalizer)
        .filter(this.wordFilter)

      for (let i = 0; i < words.length - 1; i++) {
        const word = words[i]
        const nextWord = words[i + 1]

        if(!this.wordBank[word]) {
          this.wordBank[word] = {}
        }

        if(!this.wordBank[word][nextWord]) {
          this.wordBank[word][nextWord] = 1
        }
        else {
          this.wordBank[word][nextWord] += 1
        }
      }
    })
  }
}
