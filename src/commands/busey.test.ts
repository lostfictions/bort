import command, { USAGE } from "./busey.ts";

import makeMockDb from "../store/mock-db.ts";
import { key as keyConcept } from "../store/methods/concepts.ts";
import { keyTrigramForward } from "../store/methods/markov.ts";

describe("busey", () => {
  const channel = "cool_chats";

  const getStore = () => ({
    [keyConcept("xconcept")]: { a: 1 },
    [keyTrigramForward("aa", "bb", channel)]: { cc: 1 },
    [keyTrigramForward("bb", "cc", channel)]: { dd: 1 },
    [keyTrigramForward("cc", "dd", channel)]: { ee: 1 },
    [keyTrigramForward("c_shouldnt_be_picked", "hi", channel)]: { uhoh: 1 },
    [keyTrigramForward("dd", "ee", channel)]: { ff: 1 },
  });

  describe("busey command", () => {
    it("should return usage on empty", async () => {
      const { db } = makeMockDb(getStore());

      const result = await command.handleMessage({
        message: "busey",
        store: db,
        channel,
      } as any);
      expect(result).toBe(USAGE);
    });

    it("should prefer words that follow from other words", async () => {
      const { db } = makeMockDb(getStore());

      return Promise.all(
        [...Array(5)].map(async () => {
          const result = await command.handleMessage({
            message: "busey abc",
            store: db,
            channel,
          } as any);
          expect(result).toBe("Aa Bb Cc");
        }),
      );
    });

    it("should trace returns and acro based on them", async () => {
      const { db } = makeMockDb(getStore());

      const result = await command.handleMessage({
        message: "busey [xconcept]",
        store: db,
        channel,
      } as any);
      expect(result).toBe("(a)\nAa");
    });

    it("should handle punctuation by reinserting it at the correct location", async () => {
      const { db } = makeMockDb(getStore());

      const result = await command.handleMessage({
        message: "busey ab:d",
        store: db,
        channel,
      } as any);
      expect(result).toBe("Aa Bb : Dd");
    });

    it("lookahead only when possible [Sentry error BORT-12]", async () => {
      const { db } = makeMockDb(getStore());

      const result = await command.handleMessage({
        message: "busey defi",
        store: db,
        channel,
      } as any);

      expect(result).toBe("Dd Ee Ff");
    });
  });
});
