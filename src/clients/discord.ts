import {
  Client as DiscordClient,
  Message as DiscordMessage,
  TextChannel,
  DMChannel,
  Guild,
  GuildEmoji,
  DiscordAPIError,
  ChannelType,
  GatewayIntentBits,
  MessageType,
  type Channel,
} from "discord.js";
import * as Sentry from "@sentry/node";

import { getDb } from "../store/get-db.ts";
import messageHandler from "../root-handler.ts";

import { processMessage } from "../util/handler.ts";
import { initializeMarkov } from "../store/methods/markov.ts";
import { activateAllTimers, getTimerMessage } from "../store/methods/timers.ts";
import {
  decrementReactionEmojiCount,
  incrementReactionEmojiCount,
} from "../store/methods/emoji-count.ts";

import type { HandlerArgs } from "../handler-args.ts";

export const getStoreNameForGuild = (guild: Guild) =>
  `discord-${guild.name}-${guild.id}`;

export function getStoreNameForChannel(channel: Channel): string {
  if (
    channel.type === ChannelType.GuildText ||
    channel.type === ChannelType.PublicThread
  ) {
    return getStoreNameForGuild(channel.guild);
  }
  if (channel.type === ChannelType.DM) {
    return `discord-dm-${channel.recipientId}-${channel.id}`;
  }

  console.warn(
    `message received in unknown channel type:`,
    `[${channel.type}] (id: ${channel.id})`,
  );
  return `discord-other-${channel.id}`;
}

/**
 * Get the id we use internally in our DB for the channel (preferring friendly
 * names over snowflakes). Yes, that does mean if a channel is recreated with
 * the same name the store will be carried over for now. (Could be a TODO:
 * delete corresponding DB slice when a channel delete event is emitted)
 */
export function getInternalChannelId(channel: Channel): string {
  if (channel.type === ChannelType.GuildText) return channel.name;
  if (channel.type === ChannelType.PublicThread && channel.parent) {
    return channel.parent.name;
  }
  if (channel.type === ChannelType.DM) return channel.recipientId;
  return `other-${channel.id}`;
}

const initializeChannel = async (channel: Channel) => {
  const storeName = getStoreNameForChannel(channel);
  const store = await getDb(storeName);
  const channelId = getInternalChannelId(channel);
  console.log(`initializing store '${storeName}' for channel ${channelId}`);
  await initializeMarkov(store, channelId);
};

export function makeDiscordBot(discordToken: string) {
  const client = new DiscordClient({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.MessageContent,
    ],
  });

  let guildList = "guild-list-not-yet-retrieved";

  async function onMessage(
    message: DiscordMessage,
  ): Promise<false | undefined> {
    try {
      if (message.author.bot) {
        return false;
      }

      // Don't respond to non-message messages.
      if (message.type !== MessageType.Default) {
        console.log(`Discord bot: Ignoring message type "${message.type}"`);
        return false;
      }

      const storeName = getStoreNameForChannel(message.channel);
      const store = await getDb(storeName);

      const response = await processMessage<HandlerArgs>(messageHandler, {
        store,
        message: message.content,
        username: message.author.username,
        channel: getInternalChannelId(message.channel),
        isDM: message.channel.type === ChannelType.DM,
        sendMessage: async (m) => {
          if (message.channel.isSendable()) {
            for (const msg of splitMessage(m)) {
              await message.channel.send(msg).catch((e: unknown) => {
                throw e;
              });
            }
          } else {
            console.warn(
              `Trying to send message [${m}] in channel with id ${message.channel.id}, but it's not sendable`,
            );
          }
        },
        discordMeta: { message, client },
      });

      if (response === false) {
        return false;
      }

      if (message.channel.isSendable()) {
        for (const msg of splitMessage(response)) {
          await message.channel.send(msg);
        }
      }
    } catch (error) {
      const err =
        error instanceof DiscordAPIError ? error.message : String(error);

      console.error(
        `Error in Discord client replying to message ${message.id}`,
        `("${message.content}") in guild ${message.guild?.name}:`,
        `'${err}'`,
      );

      Sentry.captureException(error, {
        contexts: { message: message.toJSON() as any },
      });

      if (message.channel.isSendable()) {
        message.channel
          .send(`[Something went wrong!] [${err.slice(0, 1800)}]`)
          .catch((e: unknown) => {
            throw e;
          });
      }
    }
  }

  client.on("disconnect", (ev) => {
    console.log(`Discord bot disconnected! reason: ${ev.reason}`);
  });

  /* eslint-disable @typescript-eslint/no-misused-promises */
  client.on("ready", async () => {
    const guilds = [...client.guilds.cache.values()];

    guildList = guilds.map((g) => `'${g.name}'`).join(", ");

    console.log(
      `Connected to Discord guilds ${guildList} as ${client.user!.username}`,
    );

    let timeouts: NodeJS.Timeout[] = [];

    const checkAndReinitializeTimeouts = async () => {
      for (const timeout of timeouts) {
        clearTimeout(timeout);
      }

      timeouts = [];

      for (const guild of client.guilds.cache.values()) {
        const storeName = getStoreNameForGuild(guild);
        const store = await getDb(storeName);
        const guildTimeouts = await activateAllTimers(store, (payload) => {
          const channel = guild.channels.resolve(payload.channel);
          if (!channel) {
            console.error(
              `[${guild.name}] trying to fire reminder but can't resolve channel id [${payload.channel}]`,
            );
            return;
          }
          if (!(channel instanceof TextChannel)) {
            console.error(
              `[${guild.name}] trying to fire reminder but channel isn't text: [${channel.name}]`,
            );
            return;
          }

          for (const msg of splitMessage(getTimerMessage(payload))) {
            channel.send(msg).catch((e: unknown) => {
              throw e;
            });
          }
        });
        timeouts.push(...guildTimeouts);
      }
    };

    // because timeouts more than ~24 days into the future will overflow
    // setTimeout, let's just reinit them once per day.
    checkAndReinitializeTimeouts()
      .then(() => {
        setTimeout(checkAndReinitializeTimeouts, 1000 * 60 * 60 * 24);
      })
      .catch((e: unknown) => {
        throw e;
      });
  });

  client.on("messageCreate", onMessage);

  client.on("threadCreate", (thread, newlyCreated) => {
    if (newlyCreated && thread.joinable) {
      thread.join().catch((e: unknown) => {
        throw e;
      });
    }
  });

  // allow deleting message with ❌
  client.on("messageReactionAdd", async ({ message, emoji }, user) => {
    if (message.author === client.user && emoji.name === "❌") {
      console.log(
        `Message "${message.content}" (id ${message.id}): delete requested by user ${user.tag}`,
      );
      await message.delete();
    }
  });

  // count message reactions
  client.on("messageReactionAdd", async ({ message, emoji }, user) => {
    if (user.bot) return false;
    if (message.channel instanceof DMChannel) return false;

    if (emoji instanceof GuildEmoji) {
      const storeName = getStoreNameForChannel(message.channel);
      const store = await getDb(storeName);
      await incrementReactionEmojiCount(store, emoji.id);
    }
  });
  client.on("messageReactionRemove", async ({ message, emoji }, user) => {
    if (user.bot) return false;
    if (message.channel instanceof DMChannel) return false;

    if (emoji instanceof GuildEmoji) {
      const storeName = getStoreNameForChannel(message.channel);
      const store = await getDb(storeName);
      await decrementReactionEmojiCount(store, emoji.id);
    }
  });

  client.on("channelCreate", initializeChannel);

  // when added to a new server:
  client.on("guildCreate", async (guild) => {
    console.log(`Added to guild: "${guild.name}". Initializing channels...`);
    for (const channel of guild.channels.cache.values()) {
      await initializeChannel(channel);
    }
    console.log(`Done initializing channels for guild ${guild.name}`);
  });
  /* eslint-enable @typescript-eslint/no-misused-promises */

  // TODO: channel delete, channel rename, removed from guild

  // TODO: flag channels as initialized and wait for flag in channels before
  // responding?

  return {
    client,
    login: client.login.bind(client, discordToken) as () => Promise<string>,
  };
}

/**
 * Splits a string into multiple chunks at a designated character that do not
 * exceed a specific length.
 *
 * Adapted from deleted functionality in Discord.js:
 * https://github.com/discordjs/discord.js/pull/7780/files
 */
function splitMessage(text: string): string[] {
  const maxLength = 2_000;

  const char = "\n";

  if (text.length <= maxLength) return [text];
  const splitText = text.split(char);

  if (splitText.some((elem) => elem.length > maxLength)) {
    throw new RangeError("SPLIT_MAX_LEN");
  }
  const messages = [];
  let msg = "";
  for (const chunk of splitText) {
    if (msg && (msg + char + chunk).length > maxLength) {
      messages.push(msg);
      msg = "";
    }
    msg += (msg && msg !== "" ? char : "") + chunk;
  }
  return messages.concat(msg).filter((m) => m);
}
