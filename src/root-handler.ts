import { BOT_NAME } from "./env";

import { escapeForRegex } from "./util";
import { processMessage, makeCommand, Handler, Command } from "./util/handler";

import { HandlerArgs } from "./handler-args";

import buseyCommand from "./commands/busey";
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
import trace, { matcher as traceMatcher } from "./components/trace";

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
const helpCommand = makeCommand<HandlerArgs>(
  {
    name: "list",
    aliases: ["help", "usage"]
  },
  ({ message, store }) => {
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

    const concepts = store
      .getState()
      .get("concepts")
      .keySeq()
      .toJS();

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
  ({ message, store }: HandlerArgs): string => {
    const state = store.getState();
    const wb = state.get("wordBank");
    if (message.length > 0) {
      if (traceMatcher.test(message)) {
        return message.replace(traceMatcher, (_, concept) =>
          trace({
            concepts: state.get("concepts"),
            concept
          })
        );
      }

      const words = message
        .trim()
        .split(" ")
        .filter(w => w.length > 0);
      if (words.length > 0) {
        const word = words[words.length - 1];
        if (wb.has(word)) {
          return getSentence(wb, word);
        }
      }
    }
    return getSentence(wb);
  }
] as Handler<HandlerArgs, string>[];

const handleDirectConcepts = ({
  message,
  store
}: HandlerArgs): string | false => {
  if (!message.startsWith("!")) {
    return false;
  }
  const concepts = store.getState().get("concepts");
  const matchedConcept = concepts.get(message);
  if (matchedConcept != null && matchedConcept.size > 0) {
    return trace({ concepts, concept: message });
  }
  return false;
};

const setSeen = ({ username, message, store, channel }: HandlerArgs): false => {
  store.dispatch(setSeenAction(username, message, channel));
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

// FIXME: is 'async' necessary here?
const messageHandler: Handler<HandlerArgs, string>[] = [
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
  ({ message, store }) => {
    if (
      message.length > 0 &&
      message
        .trim()
        .split(" ")
        .filter(s => s.length > 0).length > 1
    ) {
      store.dispatch(addSentenceAction(message));
    }
    return false;
  }
];

export default messageHandler;
