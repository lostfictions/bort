// run "node" from project root and import this file, then:
// let { $, html } = await load("puppies")

export async function loadFixture(term: string) {
  const { readFile } = await import("fs/promises");
  const { load } = await import("cheerio");

  const fn = `./fixtures/image-search/${term}.html`;
  const html = await readFile(fn, "utf-8");
  return { $: load(html), html };
}
