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

export function getStoreNameForChannel(channel: Channel) {
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

      const channel = (() => {
        switch (true) {
          case message.channel.type === "text":
            return (message.channel as TextChannel).name;
          case message.channel.type === "dm":
            return (message.channel as DMChannel).recipient.username;
          default:
            return `other-${message.channel.id}`;
        }
      })();

      const storeName = getStoreNameForChannel(message.channel);

      const store = await getDb(storeName);

      const response = await processMessage<HandlerArgs>(messageHandler, {
        store,
        message: message.content,
        username: message.author.username,
        channel,
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
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  client.on("message", onMessage);
  client.on("disconnect", (ev: any) => {
    console.log(`Discord bot disconnected! reason: ${ev.reason}`);
  });

  return {
    client,
    login: client.login.bind(client, discordToken) as () => Promise<string>,
  };
}
