import { it, describe, expect } from "vitest";
import { addRecent, cleanRecents, initializeRecents } from "./recents.ts";
import makeMockDb from "../mock-db.ts";

describe("db recents", () => {
  it("adds a recent 1", async () => {
    const { db, store } = makeMockDb();
    await initializeRecents(db);

    const now = Date.now();
    await addRecent(db, "bob", now);
    expect(store.recents).toEqual({
      bob: now,
    });
  });

  it("adds a recent 2", async () => {
    const { db, store } = makeMockDb();
    await initializeRecents(db);

    store.recents = {
      bob: 25,
    };

    const now = Date.now();
    await addRecent(db, "bob", now);
    expect(store.recents).toEqual({
      bob: now,
    });
  });

  it("cleans recents 1", async () => {
    const { db, store } = makeMockDb();
    await initializeRecents(db);

    await cleanRecents(db, 1);

    expect(store.recents).toEqual({});
  });

  it("cleans recents 2", async () => {
    const { db, store } = makeMockDb();
    await initializeRecents(db);

    store.recents = {
      bob: 25,
    };

    await cleanRecents(db, 1);

    expect(store.recents).toEqual({});
  });

  it("cleans recents 3", async () => {
    const { db, store } = makeMockDb();
    await initializeRecents(db);

    const now = Date.now();

    store.recents = { bob: now - 60000 * 2 };

    await cleanRecents(db, 1);

    expect(store.recents).toEqual({});
  });

  it("cleans recents 4", async () => {
    const { db, store } = makeMockDb();
    await initializeRecents(db);

    const now = Date.now();

    store.recents = { bob: now };

    await cleanRecents(db, 1);

    expect(store.recents).toEqual({
      bob: now,
    });
  });
});
