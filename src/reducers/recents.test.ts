import {
  recentsReducers,
  addRecentAction,
  cleanRecentsAction
} from "./recents";

describe("recents reducers", () => {
  test("add recent action", () => {
    const now = Date.now();
    expect(recentsReducers({}, addRecentAction("bob", now))).toEqual({
      bob: now
    });

    expect(recentsReducers({ bob: 25 }, addRecentAction("bob", now))).toEqual({
      bob: now
    });
  });

  test("clean recents action", () => {
    expect(recentsReducers({}, cleanRecentsAction(1))).toEqual({});

    expect(recentsReducers({ bob: 25 }, cleanRecentsAction(1))).toEqual({});

    const now = Date.now();

    expect(
      recentsReducers({ bob: now - 60_000 * 2 }, cleanRecentsAction(1))
    ).toEqual({});

    expect(recentsReducers({ bob: now }, cleanRecentsAction(1))).toEqual({
      bob: now
    });
  });
});
