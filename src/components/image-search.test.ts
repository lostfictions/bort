import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { it, describe, expect } from "vitest";

import { parse } from "./image-search.ts";

const fixturePath = join(import.meta.dirname, `../../fixtures/image-search`);
const fixtureFiles = readdirSync(fixturePath);

const fixtures = fixtureFiles.map((f) => [
  readFileSync(join(fixturePath, f), "utf8"),
  f,
]);

describe("image search", () => {
  describe("parse", () => {
    it("matches snapshots from fixture data", () => {
      expect.hasAssertions();
      for (const [fixture, fixtureName] of fixtures) {
        expect(parse(fixture)).toMatchSnapshot(fixtureName);
      }
    });
  });
});
