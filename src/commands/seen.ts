import * as moment from "moment";

import { makeCommand } from "../util/handler";

export default makeCommand(
  {
    name: "seen",
    description: "note when the given user was last seen"
  },
  async ({ message, store }) => {
    const seen = await store.get("seen");

    const username = message.trim().toLowerCase();

    if (!seen.has(username)) {
      return `i haven't seen ${username}!`;
    }

    const { message: lastMessage, time, channel } = seen.get(username);

    return `${username} was last seen ${moment(
      time
    ).fromNow()} in #${channel} saying: '${lastMessage}'`;
  }
);
