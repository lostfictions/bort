import command, { USAGE } from "./busey";
import { getMockStore } from "../util/get-mock-store-for-test";

describe("busey", () => {
  describe("busey command", () => {
    it("should return usage on empty", async () => {
      const result = await command.handleMessage({
        message: "busey",
        store: getMockStore()
      } as any);
      expect(result).toBe(USAGE);
    });

    it("should prefer words that follow from other words", async () => {
      return Promise.all(
        [...Array(5)].map(async () => {
          const result = await command.handleMessage({
            message: "busey abc",
            store: getMockStore()
          } as any);
          expect(result).toBe("Aa Bb Cc");
        })
      );
    });

    it("should trace returns and acro based on them", async () => {
      const result = await command.handleMessage({
        message: "busey [xconcept]",
        store: getMockStore()
      } as any);
      expect(result).toBe("(a)\nAa");
    });

    it("should handle punctuation by reinserting it at the correct location", async () => {
      const result = await command.handleMessage({
        message: "busey ab:c",
        store: getMockStore()
      } as any);
      expect(result).toBe("Aa Bb : Cc");
    });
  });
});
