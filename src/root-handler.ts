import { BOT_NAME } from "./env";

import { escapeForRegex } from "./util";
import { processMessage, makeCommand, Handler, Command } from "./util/handler";

import { HandlerArgs } from "./handler-args";

import buseyCommand from "./commands/busey";
import clapifyCommand from "./commands/clapify";
import chooseCommand from "./commands/choose";
import emojiListCommand from "./commands/emoji-list";
import seenCommand from "./commands/seen";
// import rhymeCommand from "./commands/rhyme";
import weatherCommand from "./commands/weather";
import uptimeCommand from "./commands/uptime";
import { imageSearchCommand, gifSearchCommand } from "./commands/images";
import timerCommand from "./commands/timers";
// gifcities is down, i guess :(
// import gifcitiesCommand from "./commands/gifcities";
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
  conceptMatcher,
} from "./commands/concepts";
import redirectCommand from "./commands/redirect";

import { getSentence, addSentence } from "./store/methods/markov";
import { setSeen } from "./store/methods/seen";
import { getConceptList, getConcept } from "./store/methods/concepts";

import { postRedirectedTwitterUrls } from "./components/post-redirected-twitter-urls";
import { tryTrace, trace } from "./components/trace";
import { recordEmojiCountInMessage } from "./components/reactions";

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
  emojiListCommand,
  seenCommand,
  // rhymeCommand,
  vidrandCommand,
  wikihowCommand,
  imageSearchCommand,
  gifSearchCommand,
  timerCommand,
  completeCommand,
  weatherCommand,
  uptimeCommand,
  redirectCommand,
];

const subcommandsByNameOrAlias = new Map<string, Command<HandlerArgs>>();

for (const c of subCommands) {
  const allAliases = [c.name, ...(c.aliases ?? [])];
  for (const a of allAliases) {
    const maybeCommand = subcommandsByNameOrAlias.get(a);
    if (maybeCommand) {
      console.error(
        `Command named ${a} already exists in command list! (Canonical name ${maybeCommand.name})`
      );
    } else {
      subcommandsByNameOrAlias.set(a, c);
    }
  }
}

const subcommandsMatcher = new RegExp(
  `^\\s*(${[...subcommandsByNameOrAlias.keys()]
    .map((a) => escapeForRegex(a))
    .join("|")})\\s*$`
);

// TODO: allow getting usage for subcommands
const helpCommand = makeCommand(
  {
    name: "list",
    aliases: ["help", "usage"],
  },
  async ({ message, store }) => {
    if (message.trim().length > 0) {
      const match = message.match(subcommandsMatcher);
      if (match) {
        const command = subcommandsByNameOrAlias.get(match[1]);

        if (command) {
          const reply = [command.name];
          if (command.aliases) {
            reply.push(
              `Aliases: ${command.aliases.map((a) => `*${a}*`).join(", ")}`
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

    const listens = concepts.filter((c: string) => c.startsWith("!"));
    const others = concepts.filter((c: string) => !c.startsWith("!"));

    return [
      "**Commands:**",
      subCommands.map((c) => `· *${c.name}* - ${c.description}`).join("\n"),
      listens.length > 0 ? `**Listens:**\n· ${listens.join(", ")}` : "",
      others.length > 0 ? `**Concepts:**\n· ${others.join(", ")}` : "",
    ]
      .filter((str) => str)
      .join("\n");
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
        .filter((w) => w.length > 0);

      if (words.length > 1) {
        return getSentence(store, channel, words.at(-2), words.at(-1));
      }
      if (words.length > 0) {
        return getSentence(store, channel, words.at(-1));
      }
    }
    return getSentence(store, channel);
  },
] as Handler<HandlerArgs>[];

const handleDirectConcepts = async ({
  message,
  store,
}: HandlerArgs): Promise<string | false> => {
  const trimmed = message.trim();
  if (!trimmed.startsWith("!") || trimmed.split(/\s+/)[0] !== trimmed) {
    return false;
  }

  if (await getConcept(store, trimmed)) {
    return trace({ db: store, concept: trimmed });
  }

  return false;
};

const doSetSeen = ({
  username,
  message,
  store,
  channel,
  discordMeta,
}: HandlerArgs): false => {
  let usernameOrId = username;
  if (discordMeta) {
    usernameOrId = discordMeta.message.author.id;
  }

  // we don't actually want to wait for this to finish
  setSeen(store, usernameOrId, message, channel).catch((e) => {
    throw e;
  });

  // this is always a side effect, never a handler that stops the chain
  return false;
};

const bortCommand = makeCommand(
  {
    // isParent: true,
    name: BOT_NAME,
    // name: botNames.name,
    // aliases: botNames.aliases,
    description: `it ${BOT_NAME}`,
  },
  rootCommand
);

const messageHandler = [
  recordEmojiCountInMessage,
  postRedirectedTwitterUrls,
  async (args) => (args.isDM ? false : processMessage(doSetSeen, args)),
  // Handling the direct concepts first should be safe -- it prevents the markov
  // generator fallback of the root command from eating our input.
  handleDirectConcepts,
  // If it's a DM, don't require prefixing with the bot name and don't add any
  // input to our wordbank.
  async (args) =>
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
        .filter((s) => s.length > 0).length > 1
    ) {
      await addSentence(store, message, channel);
    }
    return false;
  },
] as Handler<HandlerArgs>[];

export default messageHandler;
