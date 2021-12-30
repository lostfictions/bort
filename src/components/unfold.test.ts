/* eslint-disable no-await-in-loop */
import { setImmediate } from "timers/promises";

import { unfold } from "./unfold";

import makeMockDb from "../store/mock-db";

const fixtures: (
  | {
      type: "twitter";
      url: string;
      intermediate: string;
      result: string | false;
    }
  | { type: "tiktok"; url: string; result: string | false }
)[] = [
  {
    // video
    type: "twitter",
    url: "https://twitter.com/ianmaclarty/status/1410023056483831810",
    intermediate:
      "https://twitter.com/ianmaclarty/status/1410023056483831810/video/1",
    result: "https://unfold.local/ok_1",
  },
  {
    // gif
    type: "twitter",
    url: "https://twitter.com/kyu_fu/status/1409865730833670145",
    intermediate:
      "https://twitter.com/kyu_fu/status/1409865730833670145/photo/1",
    result: "https://unfold.local/ok_2",
  },
  {
    // mobile
    type: "twitter",
    url: "https://m.twitter.com/TmarTn/status/1388543237074210816",
    intermediate:
      "https://twitter.com/TmarTn/status/1388543237074210816/video/1",
    result: "https://unfold.local/ok_3",
  },
  {
    type: "twitter",
    url: "https://twitter.com/",
    intermediate: "",
    result: false,
  },
  // {
  //   type: "tiktok",
  //   url: "https://www.tiktok.com/@kotidiotnomer1/video/6969774073001954562",
  //   result: "http://unfold.local/ok_4",
  // },
  // {
  //   type: "tiktok",
  //   url: "https://www.tiktok.com/@morty_morty_the_cat/video/6933501171256675586?source=h5_m&_r=1",
  //   result: "http://unfold.local/ok_5",
  // },
  // {
  //   type: "tiktok",
  //   url: "https://m.tiktok.com/v/6999998598305942790.html?_d=secCgYIASAHKAESPgo81MsGOGJdwjBOqJQ0%2BibqgfQgpaHRKtJrhKY%2FxwhovqxD8P3BszESTnQroEkFEpp2PzMXid7N99KAPZqiGgA%3D&checksum=940585254b6e071c9b5e0453a29634c9c503f2dca2fe9b370b170e972d1ec36b&language=en&preview_pb=0&sec_user_id=MS4wLjABAAAAbhlTeKPO0yL_it9lWi7KKHY3Mqz3mc1riTnX9-KKLCLCV5QF8O1lLe-jOwir_hLW&share_app_id=1233&share_item_id=6999998598305942790&share_link_id=a6a0a10d-b708-42b9-87c7-ab195985c608&source=h5_m&timestamp=1630038988&u_code=deg4gblce2bl8h&user_id=6874717862625838086&utm_campaign=client_share&utm_medium=android&utm_source=copy",
  //   result: "http://unfold.local/ok_6",
  // },
  // {
  //   type: "tiktok",
  //   url: "https://www.tiktok.com/",
  //   result: false,
  // },
];

jest.mock("../util/get-video-url", () => ({
  getYtdlAvailable: () => true,
  getVideoUrl: (url: string) =>
    fixtures.find(
      (f) =>
        (f.type === "twitter" && f.intermediate === url) ||
        (f.type === "tiktok" && f.url.startsWith(url))
    )!.result,
}));

jest.mock("../util/resolve-twitter-urls", () => ({
  ...jest.requireActual("../util/resolve-twitter-urls"),
  resolveShortlinksInTweet: async (url: string) => ({
    resolvedUrl: (
      fixtures.find((f) => f.type === "twitter" && f.url === url) as any
    ).intermediate,
    hasStillImage: false,
  }),
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
