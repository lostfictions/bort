import { promises as fs } from "fs";
import path from "path";

import { request } from "../src/components/image-search";

// run with ./node_modules/.bin/ts-node --transpile-only scripts/save-image-search-fixture.ts

const term = "puppies";

(async () => {
  const res = await request({
    term,
  });

  const fn = path.join(__dirname, `../fixtures/image-search/${term}.html`);
  await fs.writeFile(fn, res.data);

  console.log(`Wrote data of len ${res.data.length} to ${fn}`);
})().catch((e) => {
  throw e;
});
