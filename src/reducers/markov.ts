import { isAddSentenceAction } from "../actions/markov";
import { WordBank } from "../components/markov";
import { Action, Reducer } from "redux";
import { Map } from "immutable";

const sentenceSplitter = /(?:\.|\?|\n)/gi;
const wordNormalizer = (word: string) => word.toLowerCase();
const wordFilter = (word: string) => word.length > 0 && !word.startsWith("<");

export const markovReducers: Reducer<WordBank> = (
  state: WordBank = Map<string, Map<string, number>>(),
  action: Action
) => {
  if (isAddSentenceAction(action)) {
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
