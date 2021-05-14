import execa from "execa";

import { getUnfoldEnabled } from "../store/methods/unfold";
import quoteForShell from "../util/shq";

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

const urlMatcher = /https:\/\/twitter\.com\/\b/gi;

export async function unfold({
  message,
  discordMeta,
  store,
}: HandlerArgs): Promise<false> {
  if (!available) return false;
  if (!discordMeta) return false;
  const enabled = await getUnfoldEnabled(store);
  if (!enabled) return false;

  console.log(discordMeta.message.embeds);
  console.log("url matches for message?", urlMatcher.test(message));
  console.log(
    "url matches for embed?",
    discordMeta.message.embeds.some((e) => urlMatcher.test(e.url!))
  );

  const twitterUrls = discordMeta.message.embeds
    .filter((e) => urlMatcher.test(e.url!))
    .map((e) => e.url!);
  const videoUrls = await Promise.all(
    twitterUrls.map((u) =>
      execa("ytdl", ["-g", quoteForShell(u)]).catch((e) => ({ error: e }))
    )
  );

  // exit code 1 might simply be the lack of video in a tweet
  console.info(
    "ytdl errors while unfolding:\n",
    videoUrls
      .filter((e) => "error" in e && e.error.exitCode === 1)
      .map((e) => (e as execa.ExecaError).stderr)
      .join("\n---\n")
  );

  console.error(
    "Errors while unfolding:\n",
    videoUrls
      .filter((e) => "error" in e && e.error.exitCode !== 1)
      .join("\n\n---\n\n")
  );

  const result = videoUrls
    .filter((res) => !("error" in res))
    .map((res) => (res as execa.ExecaReturnValue).stdout)
    .join("\n");

  if (result.trim().length > 0) {
    await discordMeta.message.channel.send(result);
  }

  return false;
}
