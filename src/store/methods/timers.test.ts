import { addTimer, removeTimer, initializeTimers } from "./timers";
import makeMockDb from "../mock-db";

describe("db timers", () => {
  test("add timer", async () => {
    const { db, store } = makeMockDb();
    await initializeTimers(db);

    const inFive = Date.now() + 1000 * 60 * 5;

    const payload1 = {
      message: "do laundry",
      time: inFive,
      user: "bob",
      creator: "bob",
    };
    const payload2 = {
      message: "do dishes",
      time: inFive,
      user: "frob",
      creator: "frob",
    };

    const id1 = await addTimer(db, payload1);
    const id2 = await addTimer(db, payload2);

    expect(store.timers.timers).toEqual({
      [id1]: payload1,
      [id2]: payload2,
    });
  });

  test("remove timer", async () => {
    const { db, store } = makeMockDb();
    await initializeTimers(db);

    const inFive = Date.now() + 1000 * 60 * 5;

    const payload = {
      message: "do laundry",
      time: inFive,
      user: "bob",
      creator: "bob",
    };

    const id = await addTimer(db, payload);

    await removeTimer(db, id);

    expect(store.timers.timers).toEqual({});
  });
});
