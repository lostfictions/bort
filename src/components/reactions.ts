import { incrementChatEmojiCount } from "../store/methods/emoji-count";

import type { HandlerArgs } from "../handler-args";

const messageCustomEmojiMatcher = /<:([a-zA-Z0-9_]{2,}):(\d+)>/g;

export async function recordEmojiCountInMessage({
  message,
  discordMeta,
  store,
}: HandlerArgs): Promise<false> {
  if (!discordMeta) return false;

  const emojis = [...message.matchAll(messageCustomEmojiMatcher)];

  if (emojis.length > 0) {
    for (const match of emojis) {
      await incrementChatEmojiCount(store, match[2]);
    }
  }

  return false;
}
