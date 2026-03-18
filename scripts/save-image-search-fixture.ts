import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { request } from "../src/components/image-search.ts";

const term = "puppies";

(async () => {
  const res = await request({
    term,
  });

  const fn = join(import.meta.dirname, `../fixtures/image-search/${term}.html`);
  await writeFile(fn, res);

  console.log(`Wrote data of len ${res.length} to ${fn}`);
})().catch((e: unknown) => {
  throw e;
});
