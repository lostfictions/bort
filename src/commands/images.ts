import { Map as ImmMap } from "immutable";
import * as got from "got";
import * as cheerio from "cheerio";

import { randomInArray } from "../util";
import { makeCommand } from "../util/handler";

import { addRecentAction } from "../reducers/recents";
import { tryTrace } from "../components/trace";

// based on https://github.com/jimkang/g-i-s/blob/master/index.js

const requestAndParse = (term: string, animated: boolean, exact: boolean) =>
  got("http://images.google.com/search", {
    query: {
      q: term,
      tbm: "isch", // perform an image search
      nfpr: exact ? 1 : 0, // exact search, don't correct typos
      tbs: animated ? "itp:animated" : undefined
    },
    timeout: 5000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36"
    }
  }).then(res => {
    const $ = cheerio.load(res.body);
    const metaLinks = $(".rg_meta");
    const urls: string[] = [];
    metaLinks.each((_i, el) => {
      if (el.children.length > 0 && "data" in el.children[0]) {
        const metadata = JSON.parse((el.children[0] as any).data);
        if (metadata.ou) {
          urls.push(metadata.ou);
        }
        // Elements without metadata.ou are subcategory headings in the results page.
      }
    });
    return urls;
  });

export const search = ({
  term,
  recents,
  dispatch,
  animated = false
}: {
  term: string;
  recents: ImmMap<string, number>;
  dispatch: (action: any) => void;
  animated?: boolean;
}) =>
  requestAndParse(term, animated, true)
    .then(res => {
      if (res.length === 0) {
        // if no results, try an inexact search
        return requestAndParse(term, animated, false);
      }
      return res;
    })
    .then(res => {
      const unseenResults = [];
      while (res.length > 0 && unseenResults.length < 5) {
        const i = res.shift()!;
        if (!recents.has(i)) {
          unseenResults.push(i);
        }
      }

      if (unseenResults.length === 0) {
        return "nothing :(";
      }

      const result = randomInArray(unseenResults);
      dispatch(addRecentAction(result));
      return result;
    });

export const imageSearchCommand = makeCommand(
  {
    name: "image",
    aliases: [
      `what's`,
      `who's`,
      `what is`,
      `who is`,
      `show me the`,
      `show me an`,
      `show me a`,
      `show me`
    ],
    description: "i will show you"
  },
  async ({ message, store }): Promise<string | false> => {
    if (message.length === 0) {
      return false;
    }

    const concepts = await store.get("concepts");
    const recents = await store.get("recents");
    const dispatch = store.dispatch;

    const maybeTraced = tryTrace(message, concepts);
    if (maybeTraced) {
      return search({ term: maybeTraced, recents, dispatch }).then(
        res => `(${maybeTraced})\n${res}`
      );
    }

    return search({ term: message, recents, dispatch });
  }
);

export const gifSearchCommand = makeCommand(
  {
    name: "gifsearch",
    aliases: ["gif me the", "gif me an", "gif me a", "gif me", "gif"],
    description: "moving pictures"
  },
  async ({ message, store }): Promise<string | false> => {
    if (message.length === 0) {
      return false;
    }

    const concepts = await store.get("concepts");
    const recents = await store.get("recents");
    const dispatch = store.dispatch;

    const maybeTraced = tryTrace(message, concepts);
    if (maybeTraced) {
      return search({
        term: maybeTraced,
        recents,
        dispatch,
        animated: true
      }).then(res => `(${maybeTraced})\n${res}`);
    }

    return search({ term: message, recents, dispatch, animated: true });
  }
);
