import LRU from "lru-cache";

import { getUnfoldEnabled } from "../store/methods/unfold";
import { getVideoUrl, getYtdlAvailable } from "../util/get-video-url";
import {
  baseTwitterUrlMatcher,
  resolveShortlinksInTweet,
  twitterGifOrImageUrlMatcher,
  twitterQTUrlMatcher,
  twitterVideoUrlMatcher,
  youtubeVideoUrlMatcher,
} from "../util/resolve-twitter-urls";

import type { HandlerArgs } from "../handler-args";

const cachedUnfoldResults = new LRU<string, string | false>({
  max: 5_000,
});

export async function unfold(handlerArgs: HandlerArgs): Promise<false> {
  const enabled = await getUnfoldEnabled(handlerArgs.store);
  if (!enabled) return false;

  // unfolding should never block actual command resolution
  extractAndUnfoldTwitterUrls(handlerArgs).catch((e) => {
    throw e;
  });
  unfoldTiktokVideos(handlerArgs).catch((e) => {
    throw e;
  });
  return false;
}

async function extractAndUnfoldTwitterUrls({
  message,
  sendMessage,
}: HandlerArgs): Promise<void> {
  const ytdlAvailable = getYtdlAvailable();

  const twitterUrls = [...message.matchAll(baseTwitterUrlMatcher)].map(
    (res) => res[0]
  );

  /* eslint-disable no-await-in-loop */
  for (const url of twitterUrls) {
    try {
      let cachedReply = cachedUnfoldResults.get(url);
      if (cachedReply == null) {
        const res = await resolveShortlinksInTweet(url);
        if (!res) {
          cachedUnfoldResults.set(url, false);
          continue;
        }

        const { resolvedUrl, hasStillImage } = res;

        if (twitterVideoUrlMatcher.test(resolvedUrl)) {
          if (ytdlAvailable) {
            const videoUrl = await getVideoUrl(resolvedUrl);
            cachedReply = `_(embedded twitter video for_ \`${url}\`_)_\n${videoUrl}`;
          } else {
            cachedReply = false;
          }
        } else if (twitterGifOrImageUrlMatcher.test(resolvedUrl)) {
          if (ytdlAvailable && !hasStillImage) {
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
        await sendMessage(cachedReply);
      }
    } catch (e) {
      console.error("Error while unfolding:\n", e);
    }
  }
  /* eslint-enable no-await-in-loop */
}

export const tiktokVideoUrlMatcher =
  /https:\/\/(?:www\.tiktok\.com\/@[a-zA-Z0-9-_]+\/video\/\d+|m\.tiktok\.com\/v\/\d+\.html)/gi;

async function unfoldTiktokVideos({
  message,
  sendMessage,
}: HandlerArgs): Promise<void> {
  const ytdlAvailable = getYtdlAvailable();
  if (!ytdlAvailable) return;

  const tiktokUrls = [...message.matchAll(tiktokVideoUrlMatcher)].map(
    (res) => res[0]
  );

  /* eslint-disable no-await-in-loop */
  for (const url of tiktokUrls) {
    try {
      let cachedReply = cachedUnfoldResults.get(url);
      if (cachedReply == null) {
        const videoUrl = await getVideoUrl(url);
        cachedReply = `_(embedded video for_ \`${url}\`_)_\n${videoUrl}`;
        cachedUnfoldResults.set(url, cachedReply);
      }

      if (cachedReply) {
        await sendMessage(cachedReply);
      }
    } catch (e) {
      console.error("Error while unfolding:\n", e);
    }
  }
  /* eslint-enable no-await-in-loop */
}
