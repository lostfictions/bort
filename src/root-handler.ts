import { BOT_NAME } from "./env";

import { escapeForRegex } from "./util";
import { processMessage, makeCommand, Handler, Command } from "./util/handler";

import { HandlerArgs } from "./handler-args";

import buseyCommand from "./commands/busey";
import clapifyCommand from "./commands/clapify";
import seenCommand from "./commands/seen";
import rhymeCommand from "./commands/rhyme";
import weatherCommand from "./commands/weather";
import uptimeCommand from "./commands/uptime";
import { imageSearchCommand, gifSearchCommand } from "./commands/images";
import gifcitiesCommand from "./commands/gifcities";
import completeCommand from "./commands/complete";
import wikihowCommand from "./commands/wikihow";
import conceptLoadCommand from "./commands/concept-load";
import shuffleCommand from "./commands/shuffle";
import {
  conceptAddCommand,
  conceptSetCommand,
  conceptRemoveCommand,
  conceptListCommand,
  conceptMatcher
} from "./commands/concepts";

import { getSentence } from "./components/markov";
import trace, { tryTrace } from "./components/trace";

import { addSentenceAction } from "./reducers/markov";
import { setSeenAction } from "./reducers/seen";

const subCommands = [
  conceptAddCommand,
  conceptSetCommand,
  conceptRemoveCommand,
  conceptLoadCommand,
  conceptListCommand,
  shuffleCommand,
  buseyCommand,
  clapifyCommand,
  seenCommand,
  rhymeCommand,
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
        `Command named ${a} already exists in command list! (Canonical name ${
          subcommandsByNameOrAlias[a].name
        })`
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

    const concepts = Object.keys(await store.get("concepts"));

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
  async ({ message, store }: HandlerArgs): Promise<string> => {
    const wb = await store.get("wordBank");
    if (message.length > 0) {
      const concepts = await store.get("concepts");
      const res = tryTrace(message, concepts);
      if (res !== false) return res;

      const words = message
        .trim()
        .split(" ")
        .filter(w => w.length > 0);

      if (words.length > 0) {
        const word = words[words.length - 1];
        if (word in wb) {
          return getSentence(wb, word);
        }
      }
    }

    return getSentence(wb);
  }
] as Handler<HandlerArgs, string>[];

const handleDirectConcepts = async ({
  message,
  store
}: HandlerArgs): Promise<string | false> => {
  if (!message.startsWith("!")) {
    return false;
  }
  const concepts = await store.get("concepts");
  const matchedConcept = concepts[message];
  if (matchedConcept != null && matchedConcept.length > 0) {
    return trace({ concepts, concept: message });
  }
  return false;
};

const setSeen = async ({
  username,
  message,
  store,
  channel
}: HandlerArgs): Promise<false> => {
  await store.dispatch(setSeenAction(username, message, channel));
  return false;
};

const bortCommand = makeCommand<HandlerArgs>(
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
  async args => (args.isDM ? false : processMessage(setSeen, args)),
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
  async ({ message, store }) => {
    if (
      message.length > 0 &&
      message
        .trim()
        .split(" ")
        .filter(s => s.length > 0).length > 1
    ) {
      await store.dispatch(addSentenceAction(message));
    }
    return false;
  }
] as Handler<HandlerArgs, string>[];

export default messageHandler;
