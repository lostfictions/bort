import { addRecent, cleanRecents, initializeRecents } from "./recents";
import makeMockDb from "../mock-db";

describe("db recents", () => {
  test("add recent 1", async () => {
    const { db, store } = makeMockDb();
    await initializeRecents(db);

    const now = Date.now();
    await addRecent(db, "bob", now);
    expect(store.recents).toEqual({
      bob: now
    });
  });

  test("add recent 2", async () => {
    const { db, store } = makeMockDb();
    await initializeRecents(db);

    store.recents = {
      bob: 25
    };

    const now = Date.now();
    await addRecent(db, "bob", now);
    expect(store.recents).toEqual({
      bob: now
    });
  });

  test("clean recents 1", async () => {
    const { db, store } = makeMockDb();
    await initializeRecents(db);

    await cleanRecents(db, 1);

    expect(store.recents).toEqual({});
  });

  test("clean recents 2", async () => {
    const { db, store } = makeMockDb();
    await initializeRecents(db);

    store.recents = {
      bob: 25
    };

    await cleanRecents(db, 1);

    expect(store.recents).toEqual({});
  });

  test("clean recents 3", async () => {
    const { db, store } = makeMockDb();
    await initializeRecents(db);

    const now = Date.now();

    store.recents = { bob: now - 60000 * 2 };

    await cleanRecents(db, 1);

    expect(store.recents).toEqual({});
  });

  test("clean recents 4", async () => {
    const { db, store } = makeMockDb();
    await initializeRecents(db);

    const now = Date.now();

    store.recents = { bob: now };

    await cleanRecents(db, 1);

    expect(store.recents).toEqual({
      bob: now
    });
  });
});
