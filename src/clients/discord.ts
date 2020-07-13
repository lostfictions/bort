import {
  Client as DiscordClient,
  Message as DiscordMessage,
  Channel,
  TextChannel,
  GuildChannel,
  DMChannel,
} from "discord.js";

import { getDb } from "../store/get-db";
import messageHandler from "../root-handler";
import { HandlerArgs } from "../handler-args";

import { processMessage } from "../util/handler";
import { initializeMarkov } from "../store/methods/markov";

export function getStoreNameForChannel(channel: Channel): string {
  if (channel instanceof GuildChannel) {
    return `discord-${channel.guild.name}-${channel.guild.id}`;
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

  client.on("ready", () => {
    guildList = client.guilds.cache
      .array()
      .map((g) => `'${g.name}'`)
      .join(", ");
    console.log(
      `Connected to Discord guilds ${guildList} as ${client.user!.username}`
    );
  });

  client.on("disconnect", (ev: any) => {
    console.log(`Discord bot disconnected! reason: ${ev.reason}`);
  });

  /* eslint-disable @typescript-eslint/no-misused-promises */
  client.on("message", onMessage);

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
