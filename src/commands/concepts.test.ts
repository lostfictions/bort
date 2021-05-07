import {
  conceptAddCommand,
  // conceptSetCommand,
  // conceptRemoveCommand,
  // conceptListCommand,
  conceptMatcher,
} from "./concepts";

import makeMockDb from "../store/mock-db";

describe("concepts", () => {
  describe("concept add command", () => {
    it("should create a new empty concept", async () => {
      const store = {} as any;
      const { db } = makeMockDb(store);

      await conceptAddCommand.handleMessage({
        message: `add dragonball`,
        store: db,
        channel: "whatever",
        username: "user",
        sendMessage: () => Promise.resolve(),
        isDM: false,
      });

      expect(store).toHaveProperty("concept:dragonball");
      expect(store["concept:dragonball"]).toEqual({});
    });

    it("should not overwrite a concept", async () => {
      const store = { "concept:dog": { labrador: 1 } } as any;
      const { db } = makeMockDb(store);

      await conceptAddCommand.handleMessage({
        message: `add dog`,
        store: db,
        channel: "whatever",
        username: "user",
        sendMessage: () => Promise.resolve(),
        isDM: false,
      });

      expect(store).toHaveProperty("concept:dog");
      expect(store["concept:dog"]).toEqual({ labrador: 1 });
    });
  });

  describe("concept matcher", () => {
    it("should add to an existing concept", async () => {
      const store = { "concept:dog": { labrador: 1 } } as any;
      const { db } = makeMockDb(store);

      const res = await conceptMatcher({
        message: `dog + husky`,
        store: db,
        channel: "whatever",
        username: "user",
        sendMessage: () => Promise.resolve(),
        isDM: false,
      });

      expect(res).not.toBe(false);
      expect(store["concept:dog"]).toEqual({ labrador: 1, husky: 1 });
    });

    it("should bulk add to an existing concept", async () => {
      const store = { "concept:dog": { labrador: 1 } } as any;
      const { db } = makeMockDb(store);

      const res = await conceptMatcher({
        message: `dog ++ husky, chihuahua`,
        store: db,
        channel: "whatever",
        username: "user",
        sendMessage: () => Promise.resolve(),
        isDM: false,
      });

      expect(res).not.toBe(false);
      expect(store["concept:dog"]).toEqual({
        labrador: 1,
        husky: 1,
        chihuahua: 1,
      });
    });

    it("should remove from an existing concept", async () => {
      const store = { "concept:dog": { labrador: 1, husky: 1 } } as any;
      const { db } = makeMockDb(store);

      const res = await conceptMatcher({
        message: `dog - husky`,
        store: db,
        channel: "whatever",
        username: "user",
        sendMessage: () => Promise.resolve(),
        isDM: false,
      });

      expect(res).not.toBe(false);
      expect(store["concept:dog"]).toEqual({ labrador: 1 });
    });
  });
});
