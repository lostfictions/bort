import execa from "execa";
import LRU from "lru-cache";

import { getUnfoldEnabled } from "../store/methods/unfold";

import type { HandlerArgs } from "../handler-args";

let available = false;
try {
  execa.sync("which", ["ytdl"]);
  available = true;
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
        `ytdl command not available, disabling unfold functionality.`,
        `('${e.command}' returned exit code 0, no stderr output)`,
      ].join(" ")
    );
  } else {
    console.error(
      "ytdl command not available, disabling unfold functionality. details:",
      "\n",
      e
    );
  }
}

const cache = new LRU<string, string>({
  max: 10_000,
  length: (n) => n.length,
});

const urlMatcher = /https:\/\/(?:twitter\.com|t\.co)\/[a-zA-Z0-9-_/?=&]+/gi;

export async function unfold({
  message,
  discordMeta,
  store,
}: HandlerArgs): Promise<false> {
  if (!available) return false;
  if (!discordMeta) return false;
  const enabled = await getUnfoldEnabled(store);
  if (!enabled) return false;

  const twitterUrls = [...message.matchAll(urlMatcher)].map((res) => res[0]);

  for (const url of twitterUrls) {
    try {
      let cached = cache.get(url);
      if (!cached) {
        // only want concurrency of 1
        // eslint-disable-next-line no-await-in-loop
        const res = (await Promise.race([
          // uhhh this is passing user input to the command line i guess
          // but hey cursory testing doesn't show any shell injection so wtv
          execa("ytdl", ["--socket-timeout", "10", "-g", url]),
          new Promise((_, rej) => {
            setTimeout(
              () => rej(new Error("Maximum timeout exceeded!")),
              1000 * 10
            );
          }),
        ])) as execa.ExecaReturnValue;

        if (!res.stdout || res.stdout.length === 0) {
          throw new Error("unexpected empty stdout");
        }

        cached = res.stdout;
        cache.set(url, cached);
      }

      discordMeta.message.channel.send(cached).catch((e) => {
        throw e;
      });
    } catch (e) {
      // exit code 1 might simply be the lack of video in a tweet
      // FIXME: examine output for better filtering of when to log
      if ("exitCode" in e && e.exitCode === 1 && e.stderr) {
        console.info("ytdl error while unfolding:\n", e.stderr);
      } else {
        console.error("Errors while unfolding:\n", e);
      }
    }
  }

  return false;
}
