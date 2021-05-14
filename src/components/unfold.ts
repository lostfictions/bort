import execa from "execa";
import axios from "axios";
import cheerio from "cheerio";
import LRU from "lru-cache";

import { getUnfoldEnabled } from "../store/methods/unfold";

import type { HandlerArgs } from "../handler-args";

let ytdlAvailable = false;
try {
  execa.sync("which", ["ytdl"]);
  ytdlAvailable = true;
} catch (e) {
  if (
    "exitCode" in e &&
    e.exitCode === 1 &&
    e.stderr != null &&
    e.stderr.length === 0 &&
    e.command
  ) {
    console.warn(
      [
        `ytdl command not available, disabling twitter video unfold functionality.`,
        `('${e.command}' returned exit code 0, no stderr output)`,
      ].join(" ")
    );
  } else {
    console.error(
      "ytdl command not available, disabling twitter video unfold functionality.",
      "details:\n",
      e
    );
  }
}

const cachedUnfoldResults = new LRU<string, string | false>({
  max: 5_000,
});

const baseUrlMatcher = /https:\/\/(?:twitter\.com|t\.co)\/[a-zA-Z0-9-_/?=&]+/gi;
const twitterVideoUrlMatcher = /https:\/\/twitter\.com\/[a-zA-Z0-9-_]+\/status\/\d+\/video+/i;
const youtubeVideoUrlMatcher = /https:\/\/www\.youtube\.com\/[a-zA-Z0-9-_/?=&]/i;
const twitterQTUrlMatcher = /https:\/\/twitter\.com\/[a-zA-Z0-9-_]+\/status\/\d+/i;

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
        const text = cheerio
          .load(res.data)('meta[property="og:description"]')
          .attr("content");

        if (!text) {
          throw new Error(`no og:description for twitter url ${url}`);
        }

        // extract t.co urls. there should be at most one.
        const nestedUrls = [...text.matchAll(baseUrlMatcher)];
        if (nestedUrls.length > 1) {
          console.warn(
            `unexpected multiple urls in tweet description for ${url}:\n${text}`
          );
        }

        if (nestedUrls.length === 0) {
          continue;
        }

        const resolvedUrl = await axios
          .head(nestedUrls[0][0])
          .then((rr) => rr.request.res.responseUrl as string);

        if (ytdlAvailable && twitterVideoUrlMatcher.test(resolvedUrl)) {
          const execRes = (await Promise.race([
            // uhhh this is passing user input to the command line i guess
            // but hey cursory testing doesn't show any shell injection so wtv
            execa("ytdl", ["--socket-timeout", "10", "-g", resolvedUrl]),
            new Promise((_, rej) => {
              setTimeout(
                () => rej(new Error("Maximum timeout exceeded!")),
                1000 * 10
              );
            }),
          ])) as execa.ExecaReturnValue;

          if (!execRes.stdout || execRes.stdout.length === 0) {
            throw new Error("unexpected empty stdout");
          }

          cachedReply = `_(embedded twitter video for_ \`${url}\`_)_\n${execRes.stdout}`;
        } else if (youtubeVideoUrlMatcher.test(resolvedUrl)) {
          cachedReply = `_(embedded youtube video for_ \`${url}\`_)_\n${resolvedUrl}`;
        } else if (twitterQTUrlMatcher.test(resolvedUrl)) {
          cachedReply = `_(embedded quote tweet for_ \`${url}\`_)_\n${resolvedUrl}`;
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
