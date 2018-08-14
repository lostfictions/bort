import axios from "axios";
import { isURL } from "validator";

import { makeCommand } from "../util/handler";
import { loadConceptAction } from "../reducers/concepts";

const loaderRegex = /^([^ ]+) +(?:path[=: ]([\w\d.]+) +)?(?:as|to) +([^\s]+)$/;

const slackEscapeRegex = /^<(.+)>$/;

const traverse = (obj: any, path: string[]): any => {
  try {
    path.forEach(p => (obj = obj[p]));
    return obj;
  } catch (e) {
    /* just toss out any failure to traverse and return null. */
  }
  return null;
};

export default makeCommand(
  {
    name: "load",
    aliases: ["json"],
    description:
      "load a concept list from a url, overwriting existing concept if it exists"
  },
  async ({ message, store }) => {
    if (message.length === 0) {
      return false;
    }

    const matches = loaderRegex.exec(message);
    if (!matches) {
      return `*load* usage: [url] (path=path) as [concept]`;
    }

    const [, rawUrl, rawPath, concept] = matches;

    const path = rawPath.split(".");

    let url = rawUrl;
    const slackFixedUrl = slackEscapeRegex.exec(rawUrl);
    if (slackFixedUrl) {
      url = slackFixedUrl[1];
    }

    if (!isURL(url)) {
      return `Error: '${url}' doesn't appear to be a valid URL.
      *load* usage: [url] (path=path) as [concept]`;
    }

    const { data: json } = await axios.get(url, { responseType: "json" });

    let items: string[];
    if (path) {
      const itemOrItems = traverse(json, path);
      if (!itemOrItems) {
        const validKeys = Object.keys(json)
          .slice(0, 5)
          .map(k => `'${k}'`)
          .join(", ");
        throw new Error(
          `Invalid path: '${rawPath}'. Some valid keys: ${validKeys}...`
        );
      }
      if (Array.isArray(itemOrItems)) {
        items = itemOrItems.map(i => i.toString());
      } else {
        const item = itemOrItems.toString();
        if (item === "[object Object]") {
          throw new Error(
            `Requested item does not appear to be a primitive or array! Aborting.`
          );
        }
        items = [item];
      }
    } else if (Array.isArray(json)) {
      items = json.map(i => i.toString());
    } else {
      const item = json.toString();
      if (item === "[object Object]") {
        throw new Error(
          `Requested item does not appear to be a primitive or array! Aborting.`
        );
      }
      items = [item];
    }

    store.dispatch(loadConceptAction(concept, items));
    return `Loaded ${length} items from ${url}.`;
  }
);
