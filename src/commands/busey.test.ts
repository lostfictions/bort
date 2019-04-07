import command, { USAGE } from "./busey";

// ////////////////////////////////
// ////////////////////////////////
// TODO: extract all this to somewhere more sensible
import { IReadableStore } from "../store/store";

type TraceableStoreShape = {
  concepts: { [conceptName: string]: string[] };
};

type MarkovableStoreShape = {
  wordBank: { [word: string]: { [followedBy: string]: number } };
};

const mockStore: IReadableStore<TraceableStoreShape & MarkovableStoreShape> = {
  async get(key) {
    switch (key) {
      case "concepts":
        return {
          xconcept: ["a"]
        } as { [conceptName: string]: string[] };
      case "wordBank":
        return {
          aa: {
            bb: 1
          },
          bb: {
            cc: 1
          },
          cc: {},
          c_that_shouldnt_get_picked: {}
        };
      default:
        throw new Error("Unexpected store key");
    }
  }
};
// ////////////////////////////////
// ////////////////////////////////

describe("busey", () => {
  describe("busey command", () => {
    it("should return usage on empty", async () => {
      const result = await command.handleMessage({
        message: "busey",
        store: mockStore
      } as any);
      expect(result).toBe(USAGE);
    });

    it("should prefer words that follow from other words", async () => {
      return Promise.all(
        [...Array(5)].map(async () => {
          const result = await command.handleMessage({
            message: "busey abc",
            store: mockStore
          } as any);
          expect(result).toBe("Aa Bb Cc");
        })
      );
    });

    it("should trace returns and acro based on them", async () => {
      const result = await command.handleMessage({
        message: "busey [xconcept]",
        store: mockStore
      } as any);
      expect(result).toBe("(a)\nAa");
    });

    it("should handle punctuation by reinserting it at the correct location", async () => {
      const result = await command.handleMessage({
        message: "busey ab:c",
        store: mockStore
      } as any);
      expect(result).toBe("Aa Bb : Cc");
    });
  });
});
