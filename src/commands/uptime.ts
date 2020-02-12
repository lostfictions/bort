import { hostname } from "os";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { makeCommand } from "../util/handler";
import { BOT_NAME } from "../env";

dayjs.extend(relativeTime);

export default makeCommand(
  {
    name: "uptime",
    description: "info about me"
  },
  () => {
    const uptime = dayjs
      .unix(Date.now() / 1000 - process.uptime())
      .fromNow(true);

    return `hi its me <@${BOT_NAME}> i have been here for **${uptime}** via \`${hostname()}\``;
  }
);
