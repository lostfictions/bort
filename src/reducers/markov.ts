import { WordBank } from "../components/markov";
import { Map } from "immutable";

interface AddSentenceAction {
  type: "ADD_SENTENCE";
  sentence: string;
}

export const addSentenceAction = (sentence: string): AddSentenceAction => ({
  type: "ADD_SENTENCE",
  sentence
});

const sentenceSplitter = /(?:\.|\?|\n)/gi;
const wordNormalizer = (word: string) => word.toLowerCase();
const wordFilter = (word: string) => word.length > 0 && !word.startsWith("<");

export const markovReducers = (
  state: WordBank = Map(),
  action: AddSentenceAction
) => {
  switch (action.type) {
    case "ADD_SENTENCE":
      action.sentence.split(sentenceSplitter).forEach(line => {
        const words = line
          .split(" ")
          .map(wordNormalizer)
          .filter(wordFilter);

        for (let i = 0; i < words.length - 1; i++) {
          const word = words[i];
          const nextWord = words[i + 1];

          state = state.updateIn([word, nextWord], 0, v => v + 1);
        }
      });
  }

  return state;
};
