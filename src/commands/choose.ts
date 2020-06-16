import { makeCommand } from "../util/handler";
import { maybeTraced } from "../components/trace";
import { randomInArray } from "../util";

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
  }
);
