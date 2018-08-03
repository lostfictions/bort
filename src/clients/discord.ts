import {
  Client as DiscordClient,
  Message as DiscordMessage,
  TextChannel,
  DMChannel
} from "discord.js";

import { replaceDbName } from "../store/store";
import { getStore } from "../store/get-store";
import messageHandler from "../root-handler";
import { HandlerArgs } from "../handler-args";

import { processMessage } from "../util/handler";

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
          case message.guild != null:
            return message.guild.name;
          case message.channel.type === "text":
            return (message.channel as TextChannel).name;
          case message.channel.type === "dm":
            return (message.channel as DMChannel).recipient.username;
          default:
            return `other-${message.channel.id}`;
        }
      })();

      const storeName = (() => {
        switch (true) {
          case message.guild != null:
            return `discord-${message.guild.name}-${message.guild.id}`;
          case message.channel.type === "text":
            return `discord-${(message.channel as TextChannel).name}-${
              message.channel.id
            }`;
          case message.channel.type === "dm":
            return `discord-dm-${
              (message.channel as DMChannel).recipient.username
            }-${message.channel.id}`;
          default:
            return `discord-other-${message.channel.id}`;
        }
      })();

      const store = await getStore(replaceDbName(storeName));

      const response = await processMessage<HandlerArgs>(messageHandler, {
        store,
        message: message.content,
        username: message.author.username,
        channel,
        isDM: message.channel.type === "dm"
      });

      if (response === false) {
        return false;
      }

      message.channel.sendMessage(response);
    } catch (error) {
      console.error(
        `Error in Discord client (${guildList}): '${error.message}'`
      );
      message.channel.sendMessage(`[Something went wrong!] [${error.message}]`);
    }
  }

  client.on("ready", () => {
    guildList = client.guilds
      .array()
      .map(g => `'${g.name}'`)
      .join(", ");
    console.log(
      `Connected to Discord guilds ${guildList} as ${client.user.username}`
    );
  });
  client.on("message", onMessage);
  client.on("disconnect", (ev: CloseEvent) => {
    console.log("Discord bot disconnected! reason: " + ev.reason);
  });

  return {
    client,
    login: client.login.bind(client, discordToken) as () => Promise<string>
  };
}
