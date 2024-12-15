import { it, describe, expect } from "vitest";
import command from "./choose.ts";

import makeMockDb from "../store/mock-db.ts";

describe("choose", () => {
  describe("choose command", () => {
    it("should return a result from items passed in", async () => {
      const items = ["a", "b", "c", "d"];
      const result = (await command.handleMessage({
        message: `choose ${items.join(",")}`,
        store: makeMockDb().db,
      } as any)) as string;
      expect(items).toContain(result);
    });

    it("should ignore whitespace", async () => {
      const items = ["a", "b", "c", "d"];

      return Promise.all(
        [",", " ,", ", ", " , ", "   ,   "].map(async (joiner) => {
          const result = (await command.handleMessage({
            message: `choose ${items.join(joiner)}`,
            store: makeMockDb().db,
          } as any)) as string;
          expect(items).toContain(result);
        }),
      );
    });
  });
});
