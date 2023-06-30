import { getRedirectTwitterEnabled } from "../store/methods/redirect-twitter";

const baseTwitterUrlMatcher =
  /https:\/\/(?:m\.|mobile\.)?twitter\.com\/(?<path>[a-zA-Z0-9-_/?=&]+)/gi;

import type { HandlerArgs } from "../handler-args";

export async function postRedirectedTwitterUrls(
  handlerArgs: HandlerArgs
): Promise<false> {
  const enabled = await getRedirectTwitterEnabled(handlerArgs.store);
  if (!enabled) return false;

  // unfolding should never block actual command resolution
  matchAndPostUrls(handlerArgs).catch((e) => {
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
        .map((m) => `https://vxtwitter.com/${m.groups!["path"]}`)
        .join("\n")
    );
  }
}