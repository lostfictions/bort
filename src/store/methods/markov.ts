import { WordBank } from "../components/markov";

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
        // eslint-disable-next-line no-param-reassign
        state = nextState;
      });
      return state;
    default:
      return state;
  }
};

function getInitialWordbank(): WordBank {
  const tarotLines: string[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../data/corpora.json"), "utf8")
  ).tarotLines;

  assert(Array.isArray(tarotLines));
  assert(tarotLines.every(l => typeof l === "string"));

  return tarotLines.reduce(
    (p, line) => markovReducers(p, addSentenceAction(line)),
    {} as WordBank
  );
}
