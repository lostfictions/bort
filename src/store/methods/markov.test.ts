import {
  addSentence,
  getRandomSeed,
  keyTrigramForward,
  keyTrigramReverse,
  getSentence,
  DEFAULT_NAMESPACE,
} from "./markov";
import makeMockDb from "../mock-db";

describe("db markov", () => {
  describe("add sentence", () => {
    it("should make entries for a normal sentence", async () => {
      const { db, store } = makeMockDb();

      await addSentence(db, "one two three four");

      expect(store).toEqual({
        [keyTrigramForward("one", "two")]: { three: 1 },
        [keyTrigramForward("two", "three")]: { four: 1 },
        [keyTrigramReverse("four", "three")]: { two: 1 },
        [keyTrigramReverse("three", "two")]: { one: 1 },
      });
    });

    it("should boost existing entries", async () => {
      const { db, store } = makeMockDb({
        [keyTrigramForward("one", "two")]: { three: 2 },
        [keyTrigramReverse("three", "two")]: { one: 4 },
      });

      await addSentence(db, "one two three four");

      expect(store).toEqual({
        [keyTrigramForward("one", "two")]: { three: 3 },
        [keyTrigramForward("two", "three")]: { four: 1 },
        [keyTrigramReverse("four", "three")]: { two: 1 },
        [keyTrigramReverse("three", "two")]: { one: 5 },
      });
    });

    it("should not make entries for a minimal sentence", async () => {
      const { db, store } = makeMockDb();

      await addSentence(db, "so what dogg");

      expect(store).toEqual({
        [keyTrigramForward("so", "what")]: { dogg: 1 },
        [keyTrigramReverse("dogg", "what")]: { so: 1 },
      });
    });

    it("should make entries for a sentence with repeating words", async () => {
      const { db, store } = makeMockDb();

      await addSentence(db, "spiders spiders spiders spiders dog");

      expect(store).toEqual({
        [keyTrigramForward("spiders", "spiders")]: {
          spiders: 2,
          dog: 1,
        },
        [keyTrigramReverse("spiders", "spiders")]: {
          spiders: 2,
        },
        [keyTrigramReverse("dog", "spiders")]: { spiders: 1 },
      });
    });

    it("should not make entries for a very short sentence", async () => {
      const { db, store } = makeMockDb();

      await addSentence(db, "so what");

      expect(store).toEqual({});
    });
  });

  describe("random seed", () => {
    it("should return a random seed", async () => {
      const { db } = makeMockDb({
        [keyTrigramForward("one", "two")]: { three: 2 },
        [keyTrigramForward("cat", "dog")]: { cute: 1 },
      });

      const seed = await getRandomSeed(db);

      expect(seed).toEqual(
        expect.objectContaining({
          first: expect.stringMatching(/one|cat/),
          second: expect.stringMatching(/two|dog/),
        })
      );

      expect(Object.keys(seed.entry)).toEqual(
        expect.arrayContaining([expect.stringMatching(/three|cute/)])
      );
    });
  });

  describe("get sentence", () => {
    it("should generate a sentence given valid seed words", async () => {
      const { db } = makeMockDb({
        [keyTrigramForward("one", "two")]: { three: 2 },
        [keyTrigramForward("two", "three")]: { four: 1 },
      });

      const sentence = await getSentence(db, DEFAULT_NAMESPACE, "one", "two");

      // note that this depends on the stop test to continue imposing a minimum
      // length, otherwise this might get flaky
      expect(sentence).toEqual("one two three four");
    });
  });
});
