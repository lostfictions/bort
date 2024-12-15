import command from "./timers.ts";

import makeMockDb from "../store/mock-db.ts";
import { initializeTimers } from "../store/methods/timers.ts";

const startDate = new Date("2020-01-01T00:00:00.000Z").valueOf();

jest.useFakeTimers();
jest.setSystemTime(startDate);

describe("timers", () => {
  describe("timers command", () => {
    it("should ignore 'now' as a time keyword", async () => {
      const store = {} as any;
      const { db } = makeMockDb(store);
      await initializeTimers(db);

      const result = (await command.handleMessage({
        message: `remind me in 10 minutes now you're playing with power`,
        store: db,
        channel: "whatever",
        username: "user",
        sendMessage: () => Promise.resolve(),
        isDM: false,
      })) as string;

      expect(typeof result).toBe("string");
      expect(result.startsWith("okay")).toBe(true);
      expect(result).toContain("now you're");
      expect(result).toContain("tell you in 10 minutes");
    });

    // https://github.com/wanasit/chrono/issues/360
    it("should not be affected by issue wanasit/chrono#360", async () => {
      const store = {} as any;
      const { db } = makeMockDb(store);
      await initializeTimers(db);

      const result = (await command.handleMessage({
        message: `remind me in 10 minutes get eggs and milk`,
        store: db,
        channel: "whatever",
        username: "user",
        sendMessage: () => Promise.resolve(),
        isDM: false,
      })) as string;

      expect(typeof result).toBe("string");
      expect(result.startsWith("okay")).toBe(true);
      expect(result).toContain("tell you in 10 minutes");
    });
  });
});
