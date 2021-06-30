/* eslint-disable no-await-in-loop */
import { setImmediate } from "timers/promises";

import { unfold } from "./unfold";

import makeMockDb from "../store/mock-db";

const tweetFixtures = [
  // video example
  {
    tweet: "https://twitter.com/ianmaclarty/status/1410023056483831810",
    content:
      "https://twitter.com/ianmaclarty/status/1410023056483831810/video/1",
    video:
      "https://video.twimg.com/ext_tw_video/1410022451250040833/pu/vid/1280x720/fy_T7FHLjNQV4uZb.mp4?tag=12",
  },
  // gif example
  {
    tweet: "https://twitter.com/kyu_fu/status/1409865730833670145",
    content: "https://twitter.com/kyu_fu/status/1409865730833670145/photo/1",
    video: "https://video.twimg.com/tweet_video/E5DZU4_XEAArLXC.mp4",
  },
];

jest.mock("../util/get-video-url", () => ({
  getYtdlAvailable: () => true,
  getVideoUrl: (url: string) =>
    tweetFixtures.find((f) => f.content === url)!.video,
}));

jest.mock("../util/resolve-twitter-urls", () => ({
  ...jest.requireActual("../util/resolve-twitter-urls"),
  resolveShortlinksInTweet: async (url: string) => ({
    resolvedUrl: tweetFixtures.find((f) => f.tweet === url)!.content,
    hasStillImage: false,
  }),
}));

describe("unfold", () => {
  it("should unfold twitter urls with embedded media", async () => {
    for (const fixture of tweetFixtures) {
      const { db: store } = makeMockDb({
        unfold: { enabled: true },
      });

      let reply: string | null = null;
      const sendMessage = jest.fn(async (message: string) => {
        reply = message;
      });

      await unfold({
        message: fixture.tweet,
        sendMessage,
        store,
        isDM: false,
        username: "test",
        channel: "#testing",
      });

      // we need to wait a tick to flush the event queue since unfold resolves
      // urls asynchronously
      await setImmediate(null);

      expect(sendMessage).toHaveBeenCalledTimes(1);
      expect(reply).toMatch(fixture.video);
    }
  });
});
