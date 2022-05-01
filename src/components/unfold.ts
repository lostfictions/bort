import LRU from "lru-cache";

import { getUnfoldEnabled } from "../store/methods/unfold";
import { getVideoUrl } from "../util/get-video-url";
import {
  resolveShortlinksInTweet,
  baseTwitterUrlMatcher,
  twitterGifOrImageUrlMatcher,
  twitterQTUrlMatcher,
  twitterVideoUrlMatcher,
  youtubeVideoUrlMatcher,
} from "../util/resolve-twitter-urls";
import { YTDL_COMMAND } from "../env";

import type { HandlerArgs } from "../handler-args";

const ytdlAvailable = YTDL_COMMAND != null;

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
  // unfoldTiktokVideos(handlerArgs).catch((e) => {
  //   throw e;
  // });
  return false;
}

async function extractAndUnfoldTwitterUrls({
  message,
  sendMessage,
}: HandlerArgs): Promise<void> {
  const twitterUrls = [...message.matchAll(baseTwitterUrlMatcher)].map(
    (res) => res[0]
  );

  for (const url of twitterUrls) {
    try {
      let cachedReply = cachedUnfoldResults.get(url);
      if (cachedReply == null) {
        const res = await resolveShortlinksInTweet(url);
        if (!res) {
          cachedUnfoldResults.set(url, false);
          continue;
        }

        const { resolvedUrls, hasStillImage } = res;

        const replyParts: string[] = [];
        for (const resolvedUrl of resolvedUrls) {
          if (twitterVideoUrlMatcher.test(resolvedUrl)) {
            if (ytdlAvailable) {
              const videoUrl = await getVideoUrl(resolvedUrl);
              replyParts.push(
                `_(embedded twitter video for_ \`${url}\`_)_\n${videoUrl}`
              );
            } else {
              replyParts.push(
                `_(embedded twitter video exists for_ \`${url}\`_, but can't be resolved!)_`
              );
            }
          } else if (twitterGifOrImageUrlMatcher.test(resolvedUrl)) {
            if (!hasStillImage) {
              if (ytdlAvailable) {
                const videoUrl = await getVideoUrl(resolvedUrl);
                replyParts.push(
                  `_(embedded twitter gif for_ \`${url}\`_)_\n${videoUrl}`
                );
              } else {
                replyParts.push(
                  `_(embedded twitter gif exists for_ \`${url}\`_, but can't be resolved!)_`
                );
              }
            }
            // if there's one or more still images, discord handles it.
          } else if (twitterQTUrlMatcher.test(resolvedUrl)) {
            replyParts.push(
              `_(embedded quote tweet for_ \`${url}\`_)_\n${resolvedUrl}`
            );
          } else if (youtubeVideoUrlMatcher.test(resolvedUrl)) {
            replyParts.push(
              `_(embedded youtube video for_ \`${url}\`_)_\n${resolvedUrl}`
            );
          } else {
            replyParts.push(
              `_(embedded external link for_ \`${url}\`_)_\n${resolvedUrl}`
            );
          }
        }
        cachedReply = replyParts.join("\n");
        cachedUnfoldResults.set(url, cachedReply);
      }

      if (cachedReply) {
        await sendMessage(cachedReply);
      }
    } catch (e) {
      console.error("Error while unfolding:\n", e);
    }
  }
}

// const tiktokVideoUrlMatcher =
//   /https:\/\/(?:www\.tiktok\.com\/@[a-zA-Z0-9-_]+\/video\/\d+|m\.tiktok\.com\/v\/\d+\.html)/gi;

// async function unfoldTiktokVideos({
//   message,
//   sendMessage,
// }: HandlerArgs): Promise<void> {
//   const ytdlAvailable = getYtdlAvailable();
//   if (!ytdlAvailable) return;

//   const tiktokUrls = [...message.matchAll(tiktokVideoUrlMatcher)].map(
//     (res) => res[0]
//   );

//   for (const url of tiktokUrls) {
//     try {
//       let cachedReply = cachedUnfoldResults.get(url);
//       if (cachedReply == null) {
//         const videoUrl = await getVideoUrl(url);
//         cachedReply = `_(embedded video for_ \`${url}\`_)_\n${videoUrl}`;
//         cachedUnfoldResults.set(url, cachedReply);
//       }

//       if (cachedReply) {
//         await sendMessage(cachedReply);
//       }
//     } catch (e) {
//       console.error("Error while unfolding:\n", e);
//     }
//   }
// }
