import { promises as fs } from "fs";
import path from "path";

import { request } from "../src/components/image-search.ts";

const term = "puppies";

(async () => {
  const res = await request({
    term,
  });

  const fn = path.join(
    import.meta.dirname,
    `../fixtures/image-search/${term}.html`,
  );
  await fs.writeFile(fn, res);

  console.log(`Wrote data of len ${res.length} to ${fn}`);
})().catch((e: unknown) => {
  throw e;
});
