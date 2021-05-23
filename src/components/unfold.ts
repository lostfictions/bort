import axios from "axios";
import cheerio from "cheerio";
import LRU from "lru-cache";

import { getUnfoldEnabled } from "../store/methods/unfold";
import { getVideoUrl, getYtdlAvailable } from "../util/get-video-url";

import type { HandlerArgs } from "../handler-args";

const cachedUnfoldResults = new LRU<string, string | false>({
  max: 5_000,
});

const baseUrlMatcher = /https:\/\/(?:twitter\.com|t\.co)\/[a-zA-Z0-9-_/?=&]+/gi;
const twitterVideoUrlMatcher =
  /https:\/\/twitter\.com\/[a-zA-Z0-9-_]+\/status\/\d+\/video\//i;
const twitterGifOrImageUrlMatcher =
  /https:\/\/twitter\.com\/[a-zA-Z0-9-_]+\/status\/\d+\/photo\//i;
const youtubeVideoUrlMatcher =
  /https:\/\/www\.youtube\.com\/[a-zA-Z0-9-_/?=&]/i;
const twitterQTUrlMatcher =
  /https:\/\/twitter\.com\/[a-zA-Z0-9-_]+\/status\/\d+/i;

export async function unfold({
  message,
  discordMeta,
  store,
}: HandlerArgs): Promise<false> {
  if (!discordMeta) return false;
  const enabled = await getUnfoldEnabled(store);
  if (!enabled) return false;

  const twitterUrls = [...message.matchAll(baseUrlMatcher)].map(
    (res) => res[0]
  );

  /* eslint-disable no-await-in-loop */
  for (const url of twitterUrls) {
    try {
      let cachedReply = cachedUnfoldResults.get(url);
      if (cachedReply == null) {
        const res = await axios.get(url, {
          responseType: "text",
          // https://stackoverflow.com/a/64164115
          headers: {
            "User-Agent":
              "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            Range: "bytes=0-524288",
            Connection: "close",
          },
        });
        const $ = cheerio.load(res.data);

        const text = $('meta[property="og:description"]').attr("content");

        if (!text) {
          throw new Error(`no og:description for twitter url ${url}`);
        }

        // extract t.co urls.
        const nestedUrls = [...text.matchAll(baseUrlMatcher)];

        if (nestedUrls.length === 0) {
          continue;
        }

        // only resolve the last url, in keeping with twitter's styling (may want to change?)
        const resolvedUrl = await axios
          .head(nestedUrls[nestedUrls.length - 1][0])
          .then((rr) => rr.request.res.responseUrl as string);

        const ytdlAvailable = getYtdlAvailable();

        if (twitterVideoUrlMatcher.test(resolvedUrl)) {
          if (ytdlAvailable) {
            const videoUrl = await getVideoUrl(resolvedUrl);
            cachedReply = `_(embedded twitter video for_ \`${url}\`_)_\n${videoUrl}`;
          } else {
            cachedReply = false;
          }
        } else if (twitterGifOrImageUrlMatcher.test(resolvedUrl)) {
          // images will have the og:image tag set to the image url and
          // og:image:user_generated set to 'true'. gifs seemingly won't. not
          // sure of a better heuristic rn
          const isStillImage =
            $('meta[property="og:image:user_generated"]').attr("content") ===
            "true";

          if (ytdlAvailable && !isStillImage) {
            const videoUrl = await getVideoUrl(resolvedUrl);
            cachedReply = `_(embedded twitter gif for_ \`${url}\`_)_\n${videoUrl}`;
          } else {
            // discord itself handles still images
            cachedReply = false;
          }
        } else if (twitterQTUrlMatcher.test(resolvedUrl)) {
          cachedReply = `_(embedded quote tweet for_ \`${url}\`_)_\n${resolvedUrl}`;
        } else if (youtubeVideoUrlMatcher.test(resolvedUrl)) {
          cachedReply = `_(embedded youtube video for_ \`${url}\`_)_\n${resolvedUrl}`;
        } else {
          cachedReply = false;
        }
        cachedUnfoldResults.set(url, cachedReply);
      }

      if (cachedReply) {
        discordMeta.message.channel.send(cachedReply).catch((e) => {
          throw e;
        });
      }
    } catch (e) {
      console.error("Error while unfolding:\n", e);
    }
  }
  /* eslint-enable no-await-in-loop */

  return false;
}
