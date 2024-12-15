import fs from "fs";
import path from "path";

const DICT_OUT_PATH = "../data/flipdict.json";
const SYLLABLES_OUT_PATH = "../data/syllables.json";

const flipdict = fs
  .readFileSync(path.join(import.meta.dirname, "../data/flipdict.txt"))
  .toString();

const common = new Set(
  fs
    .readFileSync(
      path.join(import.meta.dirname, "../data/10000-english-usa.txt"),
    )
    .toString()
    .split("\n")
    .map((line) => line.trim()),
);

type PhonemeDict = { [key: string]: string | PhonemeDict };

const dict: PhonemeDict = {};
const syllables = new Set<string>();

for (const line of flipdict.split("\n")) {
  const phonemes = line.toLowerCase().split(" ");
  const word = phonemes.pop()!;
  if (!common.has(word)) {
    continue;
  }
  let cursor = dict;
  while (phonemes.length > 0) {
    const phon = phonemes.shift()!;
    syllables.add(phon);
    if (cursor[phon]) {
      const c = cursor[phon];
      if (typeof c === "string") {
        //TODO: fix these exceptions
        console.log(`${word}: uhh => ${c}`);
        console.dir(cursor);
        cursor[phon] = {};
        cursor = cursor[phon];
      } else {
        cursor = c;
      }
    } else {
      const phons = {};
      cursor[phon] = phons;
      cursor = phons;
    }
  }
  cursor[word] = "!";
}

fs.writeFileSync(
  path.join(import.meta.dirname, DICT_OUT_PATH),
  JSON.stringify(dict),
);
fs.writeFileSync(
  path.join(import.meta.dirname, SYLLABLES_OUT_PATH),
  JSON.stringify([...syllables.values()].sort(), undefined, 2),
);
