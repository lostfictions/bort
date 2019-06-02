import command from "./choose";
import { getMockStore } from "../util/get-mock-store-for-test";

describe("choose", () => {
  describe("choose command", () => {
    it("should return a result from items passed in", async () => {
      const items = ["a", "b", "c", "d"];
      const result = await command.handleMessage({
        message: `choose ${items.join(",")}`,
        store: getMockStore()
      } as any);
      expect(items).toContain(result);
    });

    it("should ignore whitespace", async () => {
      const items = ["a", "b", "c", "d"];

      return Promise.all(
        [",", " ,", ", ", " , ", "   ,   "].map(async joiner => {
          const result = await command.handleMessage({
            message: `choose ${items.join(joiner)}`,
            store: getMockStore()
          } as any);
          expect(items).toContain(result);
        })
      );
    });
  });
});
