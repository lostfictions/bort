import * as moment from "moment";

import { makeCommand } from "../util/handler";
import { HandlerArgs } from "../handler-args";

export default makeCommand<HandlerArgs>(
  {
    name: "seen",
    description: "note when the given user was last seen"
  },
  ({ message, store }) => {
    const seen = store.getState().get("seen");

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
