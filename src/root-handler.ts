import { BOT_NAME } from "./env";

import { escapeForRegex } from "./util";
import { processMessage, makeCommand, Handler, Command } from "./util/handler";

import { HandlerArgs } from "./handler-args";

import buseyCommand from "./commands/busey";
import clapifyCommand from "./commands/clapify";
import chooseCommand from "./commands/choose";
import seenCommand from "./commands/seen";
// import rhymeCommand from "./commands/rhyme";
import weatherCommand from "./commands/weather";
import uptimeCommand from "./commands/uptime";
import { imageSearchCommand, gifSearchCommand } from "./commands/images";
import gifcitiesCommand from "./commands/gifcities";
import completeCommand from "./commands/complete";
import wikihowCommand from "./commands/wikihow";
import conceptLoadCommand from "./commands/concept-load";
import shuffleCommand from "./commands/shuffle";
import vidrandCommand from "./commands/vidrand";
import {
  conceptAddCommand,
  conceptSetCommand,
  conceptRemoveCommand,
  conceptListCommand,
  conceptMatcher
} from "./commands/concepts";

import { getSentence, addSentence } from "./store/methods/markov";
import { setSeen } from "./store/methods/seen";
import { tryTrace } from "./components/trace";
import { getConceptList } from "./store/methods/concepts";

const subCommands = [
  conceptAddCommand,
  conceptSetCommand,
  conceptRemoveCommand,
  conceptLoadCommand,
  conceptListCommand,
  shuffleCommand,
  buseyCommand,
  clapifyCommand,
  chooseCommand,
  seenCommand,
  // rhymeCommand,
  vidrandCommand,
  wikihowCommand,
  imageSearchCommand,
  gifSearchCommand,
  gifcitiesCommand,
  completeCommand,
  weatherCommand,
  uptimeCommand
];

const subcommandsByNameOrAlias: { [name: string]: Command<HandlerArgs> } = {};
subCommands.forEach(c => {
  const allAliases = [c.name, ...(c.aliases || [])];
  for (const a of allAliases) {
    if (a in subcommandsByNameOrAlias) {
      console.error(
        `Command named ${a} already exists in command list! (Canonical name ${subcommandsByNameOrAlias[a].name})`
      );
    } else {
      subcommandsByNameOrAlias[a] = c;
    }
  }
});

const subcommandsMatcher = new RegExp(
  `^\\s*(${Object.keys(subcommandsByNameOrAlias)
    .map(a => escapeForRegex(a))
    .join("|")})\\s*$`
);

// TODO: allow getting usage for subcommands
const helpCommand = makeCommand(
  {
    name: "list",
    aliases: ["help", "usage"]
  },
  async ({ message, store }) => {
    if (message.trim().length > 0) {
      const match = message.match(subcommandsMatcher);
      if (match) {
        const command = subcommandsByNameOrAlias[match[1]];

        if (command) {
          const reply = [command.name];
          if (command.aliases) {
            reply.push(
              "Aliases: " + command.aliases.map(a => `*${a}*`).join(", ")
            );
          }
          if (command.description) {
            reply.push(command.description);
          }
          if (command.usage) {
            reply.push(command.usage);
          } else {
            reply.push("No usage info available for this command :(");
          }
          if (command.details) {
            reply.push(command.details);
          }

          return reply.join("\n");
        }
      } else {
        return "I CAN'T HELP YOU WITH THAT";
      }
    }

    const concepts = await getConceptList(store);

    return (
      "**Commands:**\n" +
      subCommands.map(c => `· *${c.name}* - ${c.description}`).join("\n") +
      "\n" +
      "**Listens:**\n· " +
      concepts.filter((c: string) => c.startsWith("!")).join(", ") +
      "\n" +
      "**Concepts:**\n· " +
      concepts.filter((c: string) => !c.startsWith("!")).join(", ")
    );
  }
);

const rootCommand = [
  ...subCommands,
  conceptMatcher,
  helpCommand,
  // If we match nothing, check if we can trace! if not, just return a markov sentence
  async ({ message, store, channel }: HandlerArgs): Promise<string> => {
    if (message.length > 0) {
      // if it's traceable, just return the trace result.
      const res = await tryTrace(store, message);
      if (res !== false) return res;

      const words = message
        .trim()
        .split(" ")
        .filter(w => w.length > 0);

      if (words.length > 1) {
        return getSentence(
          store,
          channel,
          words[words.length - 2],
          words[words.length - 1]
        );
      }
      if (words.length > 0) {
        return getSentence(store, channel, words[words.length - 1]);
      }
    }
    return getSentence(store, channel);
  }
] as Handler<HandlerArgs>[];

const handleDirectConcepts = async ({
  message,
  store
}: HandlerArgs): Promise<string | false> => {
  if (!message.startsWith("!")) {
    return false;
  }

  return tryTrace(store, message);
};

const doSetSeen = ({ username, message, store, channel }: HandlerArgs) => {
  // we don't actually want to wait for this to finish
  setSeen(store, username, message, channel).catch(e => {
    throw e;
  });
  return false as false;
};

const bortCommand = makeCommand(
  {
    // isParent: true,
    name: BOT_NAME,
    // name: botNames.name,
    // aliases: botNames.aliases,
    description: `it ${BOT_NAME}`
  },
  rootCommand
);

const messageHandler = [
  async args => (args.isDM ? false : processMessage(doSetSeen, args)),
  // Handling the direct concepts first should be safe -- it prevents the markov
  // generator fallback of the root command from eating our input.
  handleDirectConcepts,
  // If it's a DM, don't require prefixing with the bot name and don't add any
  // input to our wordbank.
  async args =>
    args.isDM
      ? processMessage(rootCommand, args)
      : processMessage(bortCommand, args),
  // If we didn't match anything, add to our markov chain.
  async ({ isDM, message, store, channel }) => {
    if (
      !isDM &&
      message.length > 0 &&
      message
        .trim()
        .split(" ")
        .filter(s => s.length > 0).length > 1
    ) {
      await addSentence(store, message, channel);
    }
    return false;
  }
] as Handler<HandlerArgs>[];

export default messageHandler;
