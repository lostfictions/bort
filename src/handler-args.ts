import type {
  Message as DiscordMessage,
  Client as DiscordClient,
} from "discord.js";
import type { DB } from "./store/get-db.ts";

export interface HandlerArgs {
  message: string;
  username: string;
  channel: string;
  store: DB;
  isDM: boolean;
  sendMessage: (message: string) => Promise<void>;
  discordMeta?: { message: DiscordMessage; client: DiscordClient };
}
