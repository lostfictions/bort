import axios from "axios";
import cheerio from "cheerio";

export const baseUrlMatcher =
  /https:\/\/(?:twitter\.com|t\.co)\/[a-zA-Z0-9-_/?=&]+/gi;
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
    return false;
  }

  // only resolve the last url, in keeping with twitter's styling
  // (TODO: no actually, resolve all the urls plz)
  const resolvedUrl = await axios
    .head(nestedUrls[nestedUrls.length - 1][0])
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
}
