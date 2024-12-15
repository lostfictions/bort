import { makeCommand } from "../util/handler.ts";
import { maybeTraced } from "../components/trace.ts";
import { randomInArray } from "../util/index.ts";

export default makeCommand(
  {
    name: "choose",
    aliases: ["pick"],
    description: "pick an option at random from a comma-separated list",
  },
  async ({ message: rawMessage, store }) => {
    if (rawMessage.trim().length === 0) return false;
    const { message, prefix } = await maybeTraced(store, rawMessage);
    return prefix + randomInArray(message.split(",").map((s) => s.trim()));
  },
);
