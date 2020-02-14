import { addSentence } from "./markov";
import makeMockDb from "../mock-db";

describe("db markov", () => {
  test("add sentence 1", async () => {
    const { db, store } = makeMockDb();

    await addSentence(db, "one two three");

    expect(store).toEqual({
      "markov:one": { two: 1 },
      "markov:two": { three: 1 },
      "markov-rev:three": { two: 1 },
      "markov-rev:two": { one: 1 }
    });
  });

  test("add sentence 2", async () => {
    const { db, store } = makeMockDb();

    await addSentence(db, "spiders spiders spiders");

    expect(store).toEqual({
      "markov:spiders": { spiders: 2 },
      "markov-rev:spiders": { spiders: 2 }
    });
  });
});
