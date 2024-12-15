import ky from "ky";

import { makeCommand } from "../util/handler.ts";
import { maybeTraced } from "../components/trace.ts";

export default makeCommand(
  {
    name: "complete",
    aliases: ["tell me"],
    description: "we know each other so well we finish each other's sentences",
  },
  async ({ message: rawMessage, store }) => {
    if (rawMessage.length === 0) {
      return false;
    }

    const { message, prefix } = await maybeTraced(store, rawMessage);

    const data = await ky
      .get(`https://suggestqueries.google.com/complete/search`, {
        searchParams: { q: message, client: "firefox" },
        timeout: 5000,
      })
      .json();

    if (
      Array.isArray(data) &&
      data.length > 0 &&
      Array.isArray(data[1]) &&
      data[1].length > 0
    ) {
      return prefix + data[1].join("\n");
    }

    return `${prefix}¯\\_(ツ)_/¯`;
  },
);
