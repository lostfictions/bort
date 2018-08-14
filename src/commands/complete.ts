import axios from "axios";

import { makeCommand } from "../util/handler";
import { HandlerArgs } from "../handler-args";
import { maybeTraced } from "../components/trace";

export default makeCommand<HandlerArgs>(
  {
    name: "complete",
    aliases: ["tell me"],
    description: "we know each other so well we finish each other's sentences"
  },
  async ({ message: rawMessage, store }) => {
    if (rawMessage.length === 0) {
      return false;
    }

    const { message, prefix } = await maybeTraced(rawMessage, store);

    const res = await axios(
      `https://suggestqueries.google.com/complete/search`,
      {
        params: { q: maybeTraced || message, client: "firefox" },
        timeout: 5000
      }
    );

    if (res.data.length > 0) {
      const parsed = JSON.parse(res.data);
      if (parsed[1] && parsed[1].length && parsed[1].length > 0) {
        return prefix + parsed[1].join("\n");
      }
    }

    return prefix + "¯\\_(ツ)_/¯";
  }
);
