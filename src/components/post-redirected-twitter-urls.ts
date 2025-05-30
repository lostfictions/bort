import { getRedirectTwitterEnabled } from "../store/methods/redirect-twitter.ts";

const baseTwitterUrlMatcher =
  /https:\/\/(?:m\.|mobile\.)?(?:x|twitter)\.com\/(?<path>[a-zA-Z0-9-_/?=&]+)/gi;

import type { HandlerArgs } from "../handler-args.ts";

export async function postRedirectedTwitterUrls(
  handlerArgs: HandlerArgs,
): Promise<false> {
  const enabled = await getRedirectTwitterEnabled(handlerArgs.store);
  if (!enabled) return false;

  // redirecting should never block actual command resolution
  matchAndPostUrls(handlerArgs).catch((e: unknown) => {
    throw e;
  });

  return false;
}

async function matchAndPostUrls({
  message,
  sendMessage,
}: HandlerArgs): Promise<void> {
  const urlMatches = [...message.matchAll(baseTwitterUrlMatcher)];

  if (urlMatches.length > 0) {
    await sendMessage(
      urlMatches
        .map(
          (m) =>
            `<https://nitter.poast.org/${m.groups!["path"]}>\nhttps://fxtwitter.com/${m.groups!["path"]}`,
        )
        .join("\n\n"),
    );
  }
}
