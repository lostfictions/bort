import { makeCommand } from "../util/handler.ts";
import { randomInArray } from "../util/index.ts";
import { maybeTraced } from "../components/trace.ts";
import {
  getEntry,
  prefixForward,
  type MarkovEntry,
} from "../store/methods/markov.ts";
import type { DB } from "../store/get-db.ts";

export const USAGE = [
  "Usage:",
  "`busey <word or sequence to be buseyfied>`",
].join("\n");

const abbreviationMatcher = /\b(?:[A-Z]\.?){2,}(?=\s|$)/dg;

if (!abbreviationMatcher.hasIndices) {
  throw new Error("feature required: regex d flag support");
}

export default makeCommand(
  {
    name: "busey",
    aliases: ["acro", "acronym"],
    description: "make buseyisms",
  },
  async ({ message: rawMessage, store, channel }) => {
    if (rawMessage.trim().length === 0) {
      return USAGE;
    }

    const { message, prefix } = await maybeTraced(store, rawMessage);

    const matches = [...message.matchAll(abbreviationMatcher)];

    if (matches.length > 0) {
      let m = message;
      for (const match of matches.reverse()) {
        const [start, end] = match.indices![0];

        const maybeReplaced = await busey(
          match[0].replaceAll(".", ""),
          store,
          channel,
        );

        m = `${m.slice(0, start)}${maybeReplaced || match[0]}${m.slice(end)}`;
      }

      return prefix + m;
    }

    const maybeReplaced = await busey(message, store, channel);
    return prefix + (maybeReplaced || "Please Inspect Senseless Sentences");
  },
);

async function busey(
  phrase: string,
  store: DB,
  channel: string,
): Promise<string | false> {
  const letters = phrase.toLowerCase().split("");

  const acro: string[] = [];

  // could actually be a proper search instead of this janky iterative thing
  // but we only have so much time and patience (computationally and in life)
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    // just reinsert punctuation and whatever else and move on
    if (!/[A-Za-z]/.test(letter)) {
      acro.push(letter);
      continue;
    }

    // let candidates: string[] | null = null;

    // First, try to find something that follows from our previous words
    if (acro.length >= 2) {
      const entry: MarkovEntry | null = await getEntry(
        store,
        acro.at(-2)!,
        acro.at(-1)!,
        channel,
      );

      if (entry) {
        const candidates = Object.keys(entry).filter((word) =>
          word.startsWith(letter),
        );
        if (candidates.length > 0) {
          let result = randomInArray(candidates);

          // if there's another (valid) letter after that, we can go one step
          // further and look ahead for it as well.
          let nextLetter = letters[i + 1] as string | undefined;
          if (nextLetter != null && !/[A-Za-z]/.test(nextLetter)) {
            nextLetter = undefined;
          }
          if (nextLetter) {
            while (candidates.length > 0) {
              const j = Math.floor(Math.random() * candidates.length);
              result = candidates.splice(j, 1)[0];
              const testEntry = await getEntry(
                store,
                acro.at(-1)!,
                result,
                channel,
              );

              if (testEntry) {
                const hasNext = Object.keys(testEntry).some((word) =>
                  word.startsWith(nextLetter),
                );

                if (hasNext) break;
              }
            }
          }

          acro.push(result);
          continue;
        }
      }
    }

    // Otherwise, grab a random word that matches our letter
    let preferredNextLetter = letters[i + 1] as string | undefined;
    if (preferredNextLetter != null && !/[A-Za-z]/.test(preferredNextLetter)) {
      preferredNextLetter = undefined;
    }

    const { preferred, others } = await getSeedStartingWith(
      store,
      channel,
      letter,
      preferredNextLetter,
    );

    // if we have preferred matches (where both the current and lookahead
    // letter are found) use those.
    if (preferred.length > 0) {
      let [first, second] = randomInArray(preferred);

      // if there's another (valid) letter after that, we can go one step
      // further and look ahead for it as well.
      let followingLetter = letters[i + 2] as string | undefined;
      if (followingLetter != null && !/[A-Za-z]/.test(followingLetter)) {
        followingLetter = undefined;
      }

      if (followingLetter) {
        while (preferred.length > 0) {
          const j = Math.floor(Math.random() * preferred.length);
          [first, second] = preferred.splice(j, 1)[0];
          const entry = await getEntry(store, first, second, channel);

          const hasFollowing = Object.keys(entry!).some((word) =>
            word.startsWith(followingLetter),
          );
          if (hasFollowing) break;
        }
      }
      acro.push(first);
      acro.push(second);
      i += 1;
    } else if (others.length > 0) {
      const [word] = randomInArray(others);
      acro.push(word);
    }
  }

  // Capitalize each word and join them into a string.
  if (acro.length > 0) {
    return acro.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
  }

  return false;
}

export async function getSeedStartingWith(
  db: DB,
  channel: string,
  letter: string,
  preferredFollowingLetter?: string,
) {
  const prefix = `${prefixForward(channel)}:`;
  const gte = `${prefix}${letter}`;
  const lt = `${prefix}${String.fromCodePoint(letter.codePointAt(0)! + 1)}`;

  const rs = db.createKeyStream({ gte, lt });

  const preferred: [string, string][] = [];
  const others: [string, string][] = [];
  for await (const k of rs) {
    const [w1, w2] = k.slice(prefix.length).split("|");
    if (preferredFollowingLetter && w2.startsWith(preferredFollowingLetter)) {
      preferred.push([w1, w2]);
    } else {
      others.push([w1, w2]);
    }
  }

  return { preferred, others };
}
