import { readFileSync, readdirSync } from "fs";
import { join } from "path";

import { parse } from "./image-search";

const fixturePath = join(__dirname, `../../fixtures/image-search`);
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
