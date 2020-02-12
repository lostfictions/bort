import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { makeCommand } from "../util/handler";

dayjs.extend(relativeTime);

export default makeCommand(
  {
    name: "seen",
    description: "note when the given user was last seen"
  },
  async ({ message, store }) => {
    const seen = await store.get("seen");

    const username = message.trim().toLowerCase();

    if (!(username in seen)) {
      return `i haven't seen ${username}!`;
    }

    const { message: lastMessage, time, channel } = seen[username];

    return `${username} was last seen ${dayjs(
      time
    ).fromNow()} in #${channel} saying: '${lastMessage}'`;
  }
);
