import { markovReducers, addSentenceAction } from "./markov";

describe("markov reducers", () => {
  test("add sentence action", () => {
    expect(markovReducers({}, addSentenceAction("one two three"))).toEqual({
      one: { two: 1 },
      two: { three: 1 }
    });

    expect(
      markovReducers({}, addSentenceAction("spiders spiders spiders"))
    ).toEqual({
      spiders: { spiders: 2 }
    });
  });
});
