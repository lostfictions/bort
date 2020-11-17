import {
  Client as DiscordClient,
  Message as DiscordMessage,
  Channel,
  TextChannel,
  GuildChannel,
  DMChannel,
  Guild,
  GuildEmoji,
} from "discord.js";

import { getDb } from "../store/get-db";
import messageHandler from "../root-handler";
import { HandlerArgs } from "../handler-args";

import { processMessage } from "../util/handler";
import { initializeMarkov } from "../store/methods/markov";
import { activateAllTimers, getTimerMessage } from "../store/methods/timers";
import {
  decrementReactionEmojiCount,
  incrementReactionEmojiCount,
} from "../store/methods/emoji-count";

export const getStoreNameForGuild = (guild: Guild) =>
  `discord-${guild.name}-${guild.id}`;

export function getStoreNameForChannel(channel: Channel): string {
  if (channel instanceof GuildChannel) {
    return getStoreNameForGuild(channel.guild);
  }
  if (channel instanceof TextChannel) {
    return `discord-${channel.name}-${channel.id}`;
  }
  if (channel instanceof DMChannel) {
    return `discord-dm-${channel.recipient.username}-${channel.id}`;
  }

  console.warn(
    `message received in unknown channel type:`,
    `[${channel.type}] (id: ${channel.id})`
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
  if (channel instanceof TextChannel) return channel.name;
  if (channel instanceof DMChannel) return channel.recipient.username;
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
  const client = new DiscordClient();

  let guildList = "guild-list-not-yet-retrieved";

  async function onMessage(
    message: DiscordMessage
  ): Promise<false | undefined> {
    try {
      if (message.author.bot) {
        return false;
      }

      // Don't respond to non-message messages.
      if (message.type !== "DEFAULT") {
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
        isDM: message.channel.type === "dm",
        sendMessage: async (m) => {
          if (!message.channel.deleted) {
            await message.channel.send(m).catch((e) => {
              throw e;
            });
          } else {
            console.warn(
              `Trying to send message [${m}] in channel with id ${message.channel.id}, but it's been deleted`
            );
          }
        },
        discordMeta: { message, client },
      });

      if (response === false) {
        return false;
      }

      await message.channel.send(response);
    } catch (error) {
      console.error(
        `Error in Discord client (${guildList}): '${error.message}'`
      );

      message.channel
        .send(`[Something went wrong!] [${error.message}]`)
        .catch((e) => {
          throw e;
        });
    }
  }

  client.on("disconnect", (ev: any) => {
    console.log(`Discord bot disconnected! reason: ${ev.reason}`);
  });

  /* eslint-disable @typescript-eslint/no-misused-promises */
  client.on("ready", async () => {
    const guilds = client.guilds.cache.array();

    guildList = guilds.map((g) => `'${g.name}'`).join(", ");

    console.log(
      `Connected to Discord guilds ${guildList} as ${client.user!.username}`
    );

    let timeouts: NodeJS.Timeout[] = [];

    const checkAndReinitializeTimeouts = async () => {
      for (const timeout of timeouts) {
        clearTimeout(timeout);
      }

      timeouts = [];

      /* eslint-disable no-await-in-loop */
      for (const guild of guilds) {
        const storeName = getStoreNameForGuild(guild);
        const store = await getDb(storeName);
        const guildTimeouts = await activateAllTimers(store, (payload) => {
          const channel = guild.channels.resolve(payload.channel);
          if (!channel) {
            console.error(
              `[${guild.name}] trying to fire reminder but can't resolve channel id [${payload.channel}]`
            );
            return;
          }
          if (!(channel instanceof TextChannel)) {
            console.error(
              `[${guild.name}] trying to fire reminder but channel isn't text: [${channel.name}]`
            );
            return;
          }

          channel.send(getTimerMessage(payload)).catch((e) => {
            throw e;
          });
        });
        timeouts.push(...guildTimeouts);
      }
      /* eslint-enable no-await-in-loop */
    };

    // because timeouts more than ~24 days into the future will overflow
    // setTimeout, let's just reinit them once per day.
    checkAndReinitializeTimeouts()
      .then(() => {
        setTimeout(checkAndReinitializeTimeouts, 1000 * 60 * 60 * 24);
      })
      .catch((e) => {
        throw e;
      });
  });

  client.on("message", onMessage);

  client.on("messageReactionAdd", async ({ message, emoji }) => {
    if (message.author.bot) return false;
    if (message.channel instanceof DMChannel) return false;

    const storeName = getStoreNameForChannel(message.channel);
    const store = await getDb(storeName);

    if (emoji instanceof GuildEmoji) {
      await incrementReactionEmojiCount(store, emoji.id);
    }
  });
  client.on("messageReactionRemove", async ({ message, emoji }) => {
    if (message.author.bot) return false;
    if (message.channel instanceof DMChannel) return false;

    const storeName = getStoreNameForChannel(message.channel);
    const store = await getDb(storeName);

    if (emoji instanceof GuildEmoji) {
      await decrementReactionEmojiCount(store, emoji.id);
    }
  });

  client.on("channelCreate", initializeChannel);

  // when added to a new server:
  client.on("guildCreate", async (guild) => {
    console.log(`Added to guild: "${guild.name}". Initializing channels...`);
    for (const channel of guild.channels.cache.values()) {
      // eslint-disable-next-line no-await-in-loop
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
