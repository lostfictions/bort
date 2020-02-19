import { addSentence, DEFAULT_NAMESPACE } from "./markov";
import makeMockDb from "../mock-db";

describe("db markov", () => {
  it("should make entries for a normal sentence", async () => {
    const { db, store } = makeMockDb();

    await addSentence(db, "one two three four");

    expect(store).toEqual({
      [`markov:${DEFAULT_NAMESPACE}:one|two`]: { three: 1 },
      [`markov:${DEFAULT_NAMESPACE}:two|three`]: { four: 1 },
      [`markov-rev:${DEFAULT_NAMESPACE}:four|three`]: { two: 1 },
      [`markov-rev:${DEFAULT_NAMESPACE}:three|two`]: { one: 1 }
    });
  });

  it("should not make entries for a minimal sentence", async () => {
    const { db, store } = makeMockDb();

    await addSentence(db, "so what dogg");

    expect(store).toEqual({
      [`markov:${DEFAULT_NAMESPACE}:so|what`]: { dogg: 1 },
      [`markov-rev:${DEFAULT_NAMESPACE}:dogg|what`]: { so: 1 }
    });
  });

  it("should make entries for a sentence with repeating words", async () => {
    const { db, store } = makeMockDb();

    await addSentence(db, "spiders spiders spiders spiders dog");

    expect(store).toEqual({
      [`markov:${DEFAULT_NAMESPACE}:spiders|spiders`]: { spiders: 2, dog: 1 },
      [`markov-rev:${DEFAULT_NAMESPACE}:spiders|spiders`]: { spiders: 2 },
      [`markov-rev:${DEFAULT_NAMESPACE}:dog|spiders`]: { spiders: 1 }
    });
  });

  it("should not make entries for a very short sentence", async () => {
    const { db, store } = makeMockDb();

    await addSentence(db, "so what");

    expect(store).toEqual({});
  });
});
