import { makeCommand } from "../util/handler";
// import { randomInArray } from "../util";

// import { maybeTraced } from "../components/trace";

// import cmu from "cmu-pronouncing-dictionary";

// interface DictNode {
//   [syllOrWord: string]: DictNode | "!";
// }

// const flipdict = require("../../data/flipdict.json") as DictNode;
// const syllableSet = new Set<string>(require("../../data/syllables.json"));

// function trim(str: string): [string, string, string] {
//   const chars = str.split("");

//   const before = [];
//   const after = [];

//   while (chars.length > 0 && chars[0].match(/[^a-zA-Z]/)) {
//     before.push(chars.shift());
//   }

//   while (chars.length > 0 && chars[chars.length - 1].match(/[^a-zA-Z]/)) {
//     after.push(chars.pop());
//   }

//   return [before.join(""), chars.join(""), after.join("")];
// }

/*

From Wikipedia:

A perfect rhyme is a form of rhyme between two words or phrases satisfying the
following conditions:

    The stressed vowel sound in both words must be identical, as well as any
    subsequent sounds. For example, "sky" and "high"; "skylight" and "highlight".

    The articulation that precedes the vowel in the words must differ. For
    example, "bean" and "green" is a perfect rhyme, while "leave" and "believe"
    is not.

*/

export default makeCommand(
  {
    name: "rhyme",
    aliases: ["rap"],
    description:
      "bust a rhyme like you never seen / taco beats gonna make you scream"
  },
  async ({ message: rawMessage }): Promise<string | false> => {
    if (rawMessage.length === 0) {
      return false;
    }

    return "potato";
    // const { message, prefix } = await maybeTraced(rawMessage, store);

    // const words = message.split(" ");
    // if (words.length === 0) {
    //   return false;
    // }

    // const wb = await store.get("wordBank");
    // const reply = [];

    // for (const word of words) {
    //   const [before, trimmedWord, after] = trim(word);

    //   let rhyme = "";
    //   if (trimmedWord.length > 0) {
    //     rhyme = getRhymeFor(trimmedWord.toLowerCase());
    //   }

    //   if (rhyme === "*") {
    //     const nexts: { [word: string]: number } | undefined =
    //       wb[reply[reply.length - 1]];
    //     if (nexts != null) {
    //       rhyme = randomInArray(Object.keys(nexts));
    //     } else {
    //       rhyme = randomInArray(Object.keys(wb));
    //     }
    //   }

    //   reply.push([before, rhyme, after].join(""));
    // }

    // let joined = reply.join(" ");

    // if (joined.length === 0) {
    //   joined = "¯\\_(ツ)_/¯";
    // }

    // return prefix + joined;
  }
);

// function getRhymeFor(word: string): string {
//   const pronounciation = cmu[word] as string | undefined;
//   if (!pronounciation) {
//     // Push a wildcard, for which we'll try to find a candidate from the wordbank in the next step.
//     return "*";
//   }

//   let cursor = flipdict;

//   const syllables = pronounciation.toLowerCase().split(" ");
//   while (syllables.length > 0) {
//     const syll = syllables.pop()!;
//     const isPrimaryStress = syll.endsWith("1");

//     const nextCursor = cursor[syll] as DictNode;

//     if (!nextCursor) {
//       break;
//     }

//     if (isPrimaryStress) {
//       // grab any word from the set that's not the articulation preceding our
//       // stress (if there is one)
//       const preceding = syllables.pop();
//       const validArticulations = Object.keys(nextCursor).filter(
//         a => a !== preceding && syllableSet.has(a)
//       );

//       // if there's no valid articulations for a perfect rhyme, just pick from
//       // lower in the tree.
//       if (validArticulations.length > 0) {
//         cursor = nextCursor[randomInArray(validArticulations)] as DictNode;
//       }

//       // eslint-disable-next-line no-constant-condition
//       while (1) {
//         const wordOrSyllable = randomInArray(Object.keys(cursor));
//         if (!syllableSet.has(wordOrSyllable)) {
//           return wordOrSyllable;
//         }
//         cursor = cursor[wordOrSyllable] as DictNode;
//       }
//       break; // eslint-disable-line no-unreachable
//     }

//     cursor = nextCursor;
//   }

//   return word;
// }
