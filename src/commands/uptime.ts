import { hostname } from "os";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import { makeCommand } from "../util/handler.ts";
import { BOT_NAME } from "../env.ts";

dayjs.extend(relativeTime);

export default makeCommand(
  {
    name: "uptime",
    description: "info about me",
  },
  ({ discordMeta }) => {
    const uptime = dayjs
      .unix(Date.now() / 1000 - process.uptime())
      .fromNow(true);

    let botName = BOT_NAME;

    if (discordMeta) {
      botName = `<@${discordMeta.client.user!.id}>`;
    }

    return `hi its me ${botName} i have been here for **${uptime}** via \`${hostname()}\``;
  },
);
