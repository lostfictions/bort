import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { makeCommand } from "../util/handler";
import { getSeen } from "../store/methods/seen";

dayjs.extend(relativeTime);

export default makeCommand(
  {
    name: "seen",
    description: "note when the given user was last seen"
  },
  async ({ message, store }) => {
    const username = message.trim().toLowerCase();

    const seen = await getSeen(store, username);

    if (!seen) {
      return `i haven't seen ${username}!`;
    }

    const { message: lastMessage, time, channel } = seen;

    return `${username} was last seen ${dayjs(
      time
    ).fromNow()} in #${channel} saying: '${lastMessage}'`;
  }
);
