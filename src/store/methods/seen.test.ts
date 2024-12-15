import makeMockDb from "../mock-db.ts";
import { setSeen, initializeSeen } from "./seen.ts";

describe("db seen", () => {
  it("sets seen via action 1", async () => {
    const { db, store } = makeMockDb();
    await initializeSeen(db);

    const now = Date.now();

    await setSeen(db, "bob", "yo", "#trends", now);

    expect(store.seen).toEqual({
      bob: {
        message: "yo",
        channel: "#trends",
        time: now,
      },
    });
  });

  it("sets seen via action 2", async () => {
    const { db, store } = makeMockDb();
    await initializeSeen(db);

    store.seen = {
      bob: {
        message: "i was thinking about that delicious apple",
        channel: "#heart",
        time: 45,
      },
      alice: {
        message: "sup",
        channel: "#money",
        time: 25,
      },
    };

    const now = Date.now();

    await setSeen(db, "bob", "yo", "#trends", now);

    expect(store.seen).toEqual({
      bob: {
        message: "yo",
        channel: "#trends",
        time: now,
      },
      alice: {
        message: "sup",
        channel: "#money",
        time: 25,
      },
    });
  });
});
