import { randomInRange, randomByWeight } from "../util";
import { Map } from "immutable";

export type WordBank = Map<string, Map<string, number>>;

//prettier-ignore
const prepositions = [
  "until", "onto", "of", "into", "out", "except", "across", "by", "between",
  "at", "down", "as", "from", "around", "with", "among", "upon", "amid", "to",
  "along", "since", "about", "off", "on", "within", "in", "during", "per",
  "without", "throughout", "through", "than", "via", "up", "unlike", "despite",
  "below", "unless", "towards", "besides", "after", "whereas", "'o", "amidst",
  "amongst", "apropos", "atop", "barring", "chez", "circa", "mid", "midst",
  "notwithstanding", "qua", "sans", "vis-a-vis", "thru", "till", "versus",
  "without", "w/o", "o'", "a'"
];

//prettier-ignore
const determiners = [
  "this", "any", "enough", "each", "whatever", "every", "these", "another",
  "plenty", "whichever", "neither", "an", "a", "least", "own", "few", "both",
  "those", "the", "that", "various", "either", "much", "some", "else", "no",
  "la", "le", "les", "des", "de", "du", "el"
];

//prettier-ignore
const conjunctions = [
  "yet", "therefore", "or", "while", "nor", "whether", "though", "because",
  "but", "for", "and", "however", "before", "although", "how", "plus",
  "versus", "not"
];

const misc = ["if", "unless", "otherwise"];

const continueSet = new Set([
  ...prepositions,
  ...determiners,
  ...conjunctions,
  ...misc
]);
const endTest = (output: string[]) =>
  output.length > 3 &&
  !continueSet.has(output[output.length - 1]) &&
  Math.random() > 0.8;

export function getSeed(wordBank: WordBank): string {
  return randomInRange(wordBank.keySeq());
}

export function getSentence(
  wordBank: WordBank,
  seed = getSeed(wordBank)
): string {
  if (!wordBank.get(seed)) {
    return "";
  }

  let word = seed;
  const sentence = [word];
  while (wordBank.has(word) && !endTest(sentence)) {
    word = randomByWeight(wordBank.get(word).toJS());
    sentence.push(word);
  }
  return sentence.join(" ");
}
