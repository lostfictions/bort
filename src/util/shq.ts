// from https://github.com/mk-pmb/shq-js/blob/master/shq.mjs

function d(m: string) {
  return m.length === 1 ? "'\\''" : `'"${m}"'`;
}

// eslint-disable-next-line no-control-regex
const n = /\x00+/g;
const b = /^[A-Za-z0-9,:=_./-]+$/;
const p = /'+/g;

function quoteForShell(x: string) {
  if (!x) {
    return "''";
  }
  const s = String(x).replace(n, "");
  const m = b.exec(s);
  if (m && m[0].length === s.length) {
    const g = "";
    return g + s + g;
  }
  return ("'" + s.replace(p, d) + "'").replace(/^''/, "").replace(/''$/, "");
}

export default quoteForShell;
