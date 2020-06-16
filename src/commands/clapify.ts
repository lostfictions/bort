import { makeCommand } from "../util/handler";
import { maybeTraced } from "../components/trace";

const whitespaceRegex = /\s+/;

export default makeCommand(
  {
    name: "clapify",
    aliases: ["clap"],
    description: ":clap: do :clap: it :clap: like :clap: this :clap:",
  },
  async ({ message: rawMessage, store }) => {
    const { message, prefix } = await maybeTraced(store, rawMessage);
    return prefix + ` ${message} `.split(whitespaceRegex).join(" :clap: ");
  }
);
