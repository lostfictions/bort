import command, { USAGE } from "./busey";

import makeMockDb from "../store/mock-db";

describe("busey", () => {
  describe("busey command", () => {
    it("should return usage on empty", async () => {
      const result = await command.handleMessage({
        message: "busey",
        store: makeMockDb().db
      } as any);
      expect(result).toBe(USAGE);
    });

    it("should prefer words that follow from other words", async () => {
      return Promise.all(
        [...Array(5)].map(async () => {
          const result = await command.handleMessage({
            message: "busey abc",
            store: makeMockDb().db
          } as any);
          expect(result).toBe("Aa Bb Cc");
        })
      );
    });

    it("should trace returns and acro based on them", async () => {
      const result = await command.handleMessage({
        message: "busey [xconcept]",
        store: makeMockDb().db
      } as any);
      expect(result).toBe("(a)\nAa");
    });

    it("should handle punctuation by reinserting it at the correct location", async () => {
      const result = await command.handleMessage({
        message: "busey ab:c",
        store: makeMockDb().db
      } as any);
      expect(result).toBe("Aa Bb : Cc");
    });
  });
});
