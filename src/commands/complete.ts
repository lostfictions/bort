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

    const res = await axios.get(
      `https://suggestqueries.google.com/complete/search`,
      {
        params: { q: message, client: "firefox" },
        timeout: 5000,
        responseType: "json"
      }
    );

    if (res.data.length > 0) {
      const data = res.data;
      if (data[1] && data[1].length && data[1].length > 0) {
        return prefix + data[1].join("\n");
      }
    }

    return prefix + "¯\\_(ツ)_/¯";
  }
);
