import { it, describe, expect } from "vitest";
import { addTimer, removeTimer, initializeTimers } from "./timers.ts";
import makeMockDb from "../mock-db.ts";

describe("db timers", () => {
  it("adds a timer", async () => {
    const { db, store } = makeMockDb();
    await initializeTimers(db);

    const inFive = Date.now() + 1000 * 60 * 5;

    const payload1 = {
      message: "do laundry",
      triggerTime: inFive,
      setTime: Date.now(),
      user: "bob",
      creator: "bob",
      channel: "main",
    };
    const payload2 = {
      message: "do dishes",
      triggerTime: inFive,
      setTime: Date.now(),
      user: "frob",
      creator: "frob",
      channel: "main",
    };

    const id1 = await addTimer(db, payload1);
    const id2 = await addTimer(db, payload2);

    expect(store.timers.timers).toEqual({
      [id1]: payload1,
      [id2]: payload2,
    });
  });

  it("removes a timer", async () => {
    const { db, store } = makeMockDb();
    await initializeTimers(db);

    const inFive = Date.now() + 1000 * 60 * 5;

    const payload = {
      message: "do laundry",
      triggerTime: inFive,
      setTime: Date.now(),
      user: "bob",
      creator: "bob",
      channel: "main",
    };

    const id = await addTimer(db, payload);

    await removeTimer(db, id);

    expect(store.timers.timers).toEqual({});
  });
});
