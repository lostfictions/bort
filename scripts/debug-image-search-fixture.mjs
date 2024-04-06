// @ts-check

// run "node" from project root
// type ".load (this filename)"
// let { $, html } = await load("puppies")

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function load(term) {
  const { readFile } = await import("fs/promises");
  const { default: cheerio } = await import("cheerio");

  const fn = `./fixtures/image-search/${term}.html`;
  const html = await readFile(fn, "utf-8");
  return { $: cheerio.load(html), html };
}
