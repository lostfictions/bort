import { makeCommand } from "../util/handler";

const whitespaceRegex = /\s+/

export default makeCommand(
  {
    name: "clapify",
    aliases: ['clap'],
    description: ":clap: do :clap: it :clap: like :clap: this :clap:"
  },
  async ({ message }) => ` ${message} `.split(whitespaceRegex).join(' :clap: ')
);
