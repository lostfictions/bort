import { URL } from "url";

import axios from "axios";
import cheerio from "cheerio";

const SCRAPER_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

export const baseTwitterUrlMatcher =
  /https:\/\/(?:(?:m\.|mobile\.)?twitter\.com|t\.co)\/[a-zA-Z0-9-_/?=&]+/gi;
export const twitterVideoUrlMatcher =
  /https:\/\/twitter\.com\/[a-zA-Z0-9-_]+\/status\/\d+\/video\//i;
export const twitterGifOrImageUrlMatcher =
  /https:\/\/twitter\.com\/[a-zA-Z0-9-_]+\/status\/\d+\/photo\//i;
export const youtubeVideoUrlMatcher =
  /https:\/\/www\.youtube\.com\/[a-zA-Z0-9-_/?=&]/i;
export const twitterQTUrlMatcher =
  /https:\/\/twitter\.com\/[a-zA-Z0-9-_]+\/status\/\d+/i;

export interface ResolveResult {
  resolvedUrls: string[];
  hasStillImage: boolean;
}

export async function resolveShortlinksInTweet(
  url: string
): Promise<ResolveResult | false> {
  const res = await axios.get(url, {
    responseType: "text",
    // https://stackoverflow.com/a/64164115
    headers: {
      "User-Agent": SCRAPER_UA,
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
  const nestedUrlMatches = [...text.matchAll(baseTwitterUrlMatcher)];

  if (nestedUrlMatches.length === 0) {
    return false;
  }

  const resolvedUrlsOrErrors = await Promise.allSettled(
    nestedUrlMatches.map(([matchUrl]) =>
      axios
        .head(matchUrl, {
          headers: { "User-Agent": SCRAPER_UA },
          // for some reason twitter has started 302-ing multiple times for
          // internal URLs, causing a redirect chain -- one that ends in a 404.
          // we use axios's `beforeRedirect` to try to abort in circumstances
          // where this is happening.
          //
          // maxRedirects: 21 should be the default, but let's set it explicitly
          // anyway. if it's 0, apparently beforeRedirect isn't called.
          maxRedirects: 21,
          beforeRedirect: (_options, { headers }) => {
            if (twitterVideoUrlMatcher.test(headers.location)) {
              // according to the axios docs, it seems the only way we can break
              // a redirect is to throw...
              // eslint-disable-next-line @typescript-eslint/no-throw-literal
              throw {
                __resolvedUrl: headers.location,
              };
            }
          },
        })
        .then((rr) => rr.request.res.responseUrl as string)
    )
  );

  const resolvedUrls: string[] = [];
  const errors: any[] = [];

  for (const result of resolvedUrlsOrErrors) {
    if (result.status === "fulfilled") {
      resolvedUrls.push(result.value);
    } else if (result.reason.__resolvedUrl) {
      resolvedUrls.push(result.reason.__resolvedUrl);
    } else {
      errors.push(result.reason);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `${errors.length} error${
        errors.length > 1 ? "s" : ""
      } encountered while resolving t.co urls:\n\n${errors
        .map((e) => e.toString())
        .join("\n\n")}`
    );
  }

  // we want to use ytdl to unfold embedded twitter gifs, whereas discord is
  // smart enough to include twitter still images in the tweet embed. however,
  // still images and gifs aren't distinguishable by url: they're both in the
  // format https://twitter.com/<user>/status/<id>/photo/...

  // the only way i've found to tell the difference is: images will have the
  // og:image tag set to the image url and og:image:user_generated set to
  // 'true'. gifs seemingly won't.

  // since tweets currently at most have one gif or video OR one or more images
  // -- you can't mix and match stills and gifs -- if the og attribute is
  // present and true, we know it's not a gif.
  const hasStillImage =
    $('meta[property="og:image:user_generated"]').attr("content") === "true";

  // twitter will now sometimes resolve t.co urls in tweets with images as...
  // the tweet url itself. (oddly the photos on twitter proper still permalink
  // to the `/photo/1` routes.) people might also share twitter urls with query
  // params like `?s=20&t=Gwd5Sb3JURbT_xr7p3bZ4g` (afaik just tracker stuff?
  // maybe selects which replies you see by default?) so we have to strip those
  // to compare to the resolved t.co url.
  const urlWithoutQuery = new URL(url);
  urlWithoutQuery.search = "";
  const canonicalTweetUrl = urlWithoutQuery.toString();

  return {
    resolvedUrls: resolvedUrls.filter((u) => u !== canonicalTweetUrl),
    hasStillImage,
  };
}
