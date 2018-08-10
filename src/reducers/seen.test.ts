import { seenReducers, setSeenAction } from "./seen";

describe("seen reducers", () => {
  test("set seen action", () => {
    const now = Date.now();
    expect(
      seenReducers({}, setSeenAction("bob", "yo", "#trends", now))
    ).toEqual({
      bob: {
        message: "yo",
        channel: "#trends",
        time: now
      }
    });

    expect(
      seenReducers(
        {
          bob: {
            message: "i was thinking about that delicious apple",
            channel: "#heart",
            time: 45
          },
          alice: {
            message: "sup",
            channel: "#money",
            time: 25
          }
        },
        setSeenAction("bob", "yo", "#trends", now)
      )
    ).toEqual({
      bob: {
        message: "yo",
        channel: "#trends",
        time: now
      },
      alice: {
        message: "sup",
        channel: "#money",
        time: 25
      }
    });
  });
});
