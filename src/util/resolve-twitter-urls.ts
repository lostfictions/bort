import axios, { AxiosError } from "axios";
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

export async function resolveShortlinksInTweet(url: string): Promise<
  | {
      resolvedUrl: string;
      hasStillImage: boolean;
    }
  | false
> {
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
  const nestedUrls = [...text.matchAll(baseTwitterUrlMatcher)];

  if (nestedUrls.length === 0) {
    return false;
  }

  try {
    // only resolve the last url, in keeping with twitter's styling
    // (TODO: no actually, resolve all the urls plz)
    const resolvedUrl = await axios
      .head(nestedUrls.at(-1)![0], {
        headers: { "User-Agent": SCRAPER_UA },
        // for some reason twitter has started 302-ing multiple times for
        // internal URLs, causing a redirect chain -- one that ends in a 404. we
        // can hack around this by capping at one redirect. a more robust (or at
        // least less blunt) solution might be to use axios's `beforeRedirect`
        // instead, but this seems to fix the problem for now.
        maxRedirects: 1,
      })
      .then((rr) => rr.request.res.responseUrl as string);

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

    return {
      resolvedUrl,
      hasStillImage,
    };
  } catch (e) {
    if (e instanceof AxiosError) {
      console.error(
        `Error resolving Twitter URL: ${nestedUrls.at(-1)![0]}: ${
          e.message
        } [code ${e.code}]`
      );
    }
    throw e;
  }
}
