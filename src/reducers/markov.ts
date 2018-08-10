import { WordBank } from "../components/markov";

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

// TODO: we need client-specific filters -- this was for slack!
const wordFilter = (word: string) => word.length > 0 && !word.startsWith("<");

export const markovReducers = (
  state: WordBank = {},
  action: AddSentenceAction
) => {
  switch (action.type) {
    case "ADD_SENTENCE":
      action.sentence.split(sentenceSplitter).forEach(line => {
        const words = line
          .split(" ")
          .map(wordNormalizer)
          .filter(wordFilter);

        const nextState = { ...state };
        for (let i = 0; i < words.length - 1; i++) {
          const word = words[i];
          const nextWord = words[i + 1];

          if (!(word in nextState)) {
            nextState[word] = {};
          }
          nextState[word] = {
            ...nextState[word],
            [nextWord]: (nextState[word][nextWord] || 0) + 1
          };
        }
        state = nextState;
      });
  }

  return state;
};
