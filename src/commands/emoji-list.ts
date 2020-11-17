import { makeCommand } from "../util/handler";
import { getEmojiCount } from "../store/methods/emoji-count";

export default makeCommand(
  {
    name: "emoji",
    description: "generate a report of custom emoji usage",
  },
  async ({ store, discordMeta }) => {
    if (!discordMeta) return "this command is only available in discord :(";

    if (!discordMeta.message.guild) {
      return "this command is only available on servers!";
    }

    const emojiCount = await getEmojiCount(store);

    const sortedEmoji = Object.entries(emojiCount)
      .map(([id, { chatCount, reactionCount }]) => ({
        id,
        chatCount,
        reactionCount,
        total: chatCount + reactionCount,
      }))
      .sort((a, b) => b.total - a.total);

    if (sortedEmoji.length === 0) {
      return "nothing to show! use some custom emoji in chat or reactions.";
    }

    const digits = sortedEmoji
      .reduce((max, e) => Math.max(e.total, max), Number.MIN_VALUE)
      .toString().length;

    const rows = ["emoji | message uses | reaction uses | total"];

    for (const e of sortedEmoji) {
      const ident = discordMeta.message.guild.emojis.resolveIdentifier(e.id);
      rows.push(
        `<:${ident}>\`|${e.chatCount
          .toString()
          .padStart(digits)}|${e.reactionCount
          .toString()
          .padStart(digits)}|${e.total.toString().padStart(digits)}\``
      );
    }

    return rows.join("\n");
  }
);
