import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { makeCommand } from "../util/handler";
import { getSeen, SeenEntry } from "../store/methods/seen";

dayjs.extend(relativeTime);

export default makeCommand(
  {
    name: "seen",
    description: "note when the given user was last seen",
  },
  async ({ message, store, discordMeta }) => {
    let usernameOrId = message.trim();

    let seen: SeenEntry | false;

    if (discordMeta) {
      const match = usernameOrId.match(/^\s*(<@!?(\d+)>)\s*/);
      if (match) {
        usernameOrId = match[1];
        seen = await getSeen(store, match[2]);
      } else {
        return `i'm not sure who you're referring to! be sure to use the @mention format, eg <@${
          discordMeta.client.user!.id
        }>`;
      }
    } else {
      seen = await getSeen(store, usernameOrId);
    }

    if (!seen) {
      return `i haven't seen ${usernameOrId}!`;
    }

    const { message: lastMessage, time, channel } = seen;

    return `${usernameOrId} was last seen ${dayjs(
      time,
    ).fromNow()} in #${channel} saying: '${lastMessage}'`;
  },
);
