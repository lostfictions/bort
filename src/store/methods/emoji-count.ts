import type { DB } from "../get-db.ts";

const key = "emoji-count";

export interface EmojiCountEntry {
  chatCount: number;
  reactionCount: number;
}

type EmojiCountData = Record<string, EmojiCountEntry>;

export async function incrementChatEmojiCount(
  db: DB,
  id: string,
): Promise<void> {
  const emoji = await db.get<EmojiCountData>(key);

  // TODO [-level] replace `in` operator
  // eslint-disable-next-line no-restricted-syntax
  if (!(id in emoji)) {
    emoji[id] = { chatCount: 0, reactionCount: 0 };
  }
  emoji[id].chatCount++;

  return db.put<EmojiCountData>(key, emoji);
}

export async function incrementReactionEmojiCount(
  db: DB,
  id: string,
): Promise<void> {
  const emoji = await db.get<EmojiCountData>(key);

  // TODO [-level] replace `in` operator
  // eslint-disable-next-line no-restricted-syntax
  if (!(id in emoji)) {
    emoji[id] = { chatCount: 0, reactionCount: 0 };
  }
  emoji[id].reactionCount++;

  return db.put<EmojiCountData>(key, emoji);
}

export async function decrementReactionEmojiCount(
  db: DB,
  id: string,
): Promise<void> {
  const emoji = await db.get<EmojiCountData>(key);

  // TODO [-level] replace `in` operator
  // eslint-disable-next-line no-restricted-syntax
  if (!(id in emoji)) {
    emoji[id] = { chatCount: 0, reactionCount: 0 };
  }
  emoji[id].reactionCount = Math.max(emoji[id].reactionCount + 1, 0);

  return db.put<EmojiCountData>(key, emoji);
}

export async function getEmojiCount(db: DB): Promise<EmojiCountData> {
  return db.get<EmojiCountData>(key);
}

export async function shouldInitializeEmojiCount(db: DB): Promise<boolean> {
  try {
    const emoji = await db.get<EmojiCountData>(key);
    if (typeof emoji !== "object") {
      return true;
    }
  } catch (e: any) {
    if (e.notFound) return true;
    throw e;
  }
  return false;
}

export async function initializeEmojiCount(db: DB) {
  await db.put<EmojiCountData>(key, {});
}
