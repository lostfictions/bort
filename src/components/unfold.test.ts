import { setImmediate } from "timers/promises";

import { unfold } from "./unfold";

import makeMockDb from "../store/mock-db";

import type { ResolveResult } from "../util/resolve-twitter-urls";

// TODO: sort of low value and i janked it up fixing it the last time it failed,
// consider revisiting (maybe with mock-service-worker or similar instead of
// mocking modules?)

const fixtures: {
  type: "twitter";
  url: string;
  intermediate: ResolveResult;
  result: string | false;
}[] = [
  {
    // video
    type: "twitter",
    url: "https://twitter.com/ianmaclarty/status/1410023056483831810",
    intermediate: {
      resolvedUrls: [
        "https://twitter.com/ianmaclarty/status/1410023056483831810/video/1",
      ],
      hasStillImage: false,
    },
    result: "https://unfold.local/ok_1",
  },
  {
    // gif
    type: "twitter",
    url: "https://twitter.com/kyu_fu/status/1409865730833670145",
    intermediate: {
      resolvedUrls: [
        "https://twitter.com/kyu_fu/status/1409865730833670145/photo/1",
      ],
      hasStillImage: false,
    },
    result: "https://unfold.local/ok_2",
  },
  {
    // mobile
    type: "twitter",
    url: "https://m.twitter.com/TmarTn/status/1388543237074210816",
    intermediate: {
      resolvedUrls: [
        "https://twitter.com/TmarTn/status/1388543237074210816/video/1",
      ],
      hasStillImage: false,
    },
    result: "https://unfold.local/ok_3",
  },
  {
    type: "twitter",
    url: "https://twitter.com/",
    intermediate: { resolvedUrls: [], hasStillImage: false },
    result: false,
  },
];

jest.mock("../util/resolve-twitter-urls", () => ({
  ...jest.requireActual("../util/resolve-twitter-urls"),
  resolveShortlinksInTweet: async (url: string) =>
    fixtures.find((f) => f.type === "twitter" && f.url === url)!.intermediate,
}));

jest.mock("../util/get-video-url", () => ({
  getYtdlAvailable: () => true,
  getVideoUrl: (url: string) =>
    fixtures.find(
      (f) => f.type === "twitter" && f.intermediate.resolvedUrls.includes(url)
    )!.result,
}));

describe("unfold", () => {
  it("should not unfold when disabled", async () => {
    for (const fixture of fixtures) {
      const { db: store } = makeMockDb({
        unfold: { enabled: false },
      });

      const sendMessage = jest.fn();

      await unfold({
        message: fixture.url,
        sendMessage,
        store,
        isDM: false,
        username: "test",
        channel: "#testing",
      });

      // we need to wait a tick to flush the event queue since unfold resolves
      // urls asynchronously
      await setImmediate(null);

      expect(sendMessage).not.toHaveBeenCalled();
    }
  });

  it("should unfold urls with embedded media", async () => {
    expect.hasAssertions();

    for (const fixture of fixtures) {
      const { db: store } = makeMockDb({
        unfold: { enabled: true },
      });

      let reply: string | null = null;
      const sendMessage = jest.fn(async (message: string) => {
        reply = message;
      });

      await unfold({
        message: fixture.url,
        sendMessage,
        store,
        isDM: false,
        username: "test",
        channel: "#testing",
      });

      // we need to wait a tick to flush the event queue since unfold resolves
      // urls asynchronously
      await setImmediate(null);

      /* eslint-disable jest/no-conditional-expect */
      if (fixture.result) {
        expect(sendMessage).toHaveBeenCalledTimes(1);
        expect(reply).toMatch(fixture.result);
      } else {
        expect(sendMessage).not.toHaveBeenCalled();
      }
      /* eslint-enable jest/no-conditional-expect */
    }
  });
});
