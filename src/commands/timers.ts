import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { parse as parseTime } from "chrono-node";

import { makeCommand } from "../util/handler";
import {
  addTimer,
  removeTimer,
  activateTimer,
  getTimerMessage,
} from "../store/methods/timers";

dayjs.extend(relativeTime);

export default makeCommand(
  {
    name: "timer",
    aliases: ["reminder", "remind"],
    description: "i will let you know",
    usage: [
      "timer [optionally who to mention] [a date or time] [the timer message]",
      "OR",
      "timer cancel [a timer id]",
    ].join("\n"),
  },
  async ({
    message: rawMessage,
    store,
    username,
    channel,
    sendMessage,
    discordMeta,
  }) => {
    const cancelMatch = rawMessage.match(/^\s*cancel\s+#?(\d+)\s*$/);
    if (cancelMatch) {
      const id = cancelMatch[1];
      const removed = await removeTimer(store, id);
      if (removed) return `ok! cancelled timer #${id}.`;
      return `there doesn't seem to be a timer with id #${id}.`;
    }

    let message = rawMessage;
    const author = discordMeta
      ? `<@!${discordMeta.message.author.id}>`
      : username;

    let target = author;

    if (message.startsWith("me ")) {
      message = message.slice(3);
    } else if (discordMeta) {
      const match = message.match(/^\s*(<@!\d+>)\s*/);
      if (match) {
        target = match[1];
        message = message.slice(match[0].length);
      }
    }

    const tryHeuristics = (heuristics: (() => string | false)[]) => {
      for (const h of heuristics) {
        const tweaked = h();
        if (tweaked) {
          const res = parseTime(tweaked, undefined, { forwardDate: true });
          if (res.length > 0) return [tweaked, res] as const;
        }
      }
      return false;
    };

    const maybeResult = tryHeuristics([
      () => message,
      // chrono won't recognize "5 minutes" but will recognize "in 5 minutes",
      // so try that first
      () => `in ${message}`,
      () => {
        const match = message.match(/^(?:in\s+)?(\d+)\s{0,1}m\b/i);
        if (!match) return false;
        return message.replace(match[0], `in ${match[1]} mins`);
      },
    ]);

    if (!maybeResult) {
      return [
        "i didn't understand when you want the timer to go off :(",
        "you can try prefixing your message with 'in 30 minutes' or even '30m'.",
        "(i need a unit to work with though! 'in 15' is too confusing for me.)",
      ].join("\n");
    }

    const [tweaked, [result]] = maybeResult;

    const finalMessage =
      tweaked.slice(0, result.index) +
      tweaked.slice(result.index + result.text.length);

    const time = result.date().valueOf();
    const now = Date.now();

    const timerId = await addTimer(store, {
      channel: discordMeta ? discordMeta.message.channel.id : channel,
      message: finalMessage,
      creator: author,
      user: target,
      setTime: now,
      triggerTime: time,
    });

    await activateTimer(store, timerId, (payload) => {
      sendMessage(getTimerMessage(payload)).catch((e) => {
        throw e;
      });
    });

    return `okay, i'll tell ${target === author ? "you" : target} ${dayjs(
      time
    ).fromNow()}: ${finalMessage} (timer id: ${timerId})`;
  }
);
