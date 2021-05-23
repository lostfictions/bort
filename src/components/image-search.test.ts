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
      fixtures.forEach(([fixture, fixtureName]) => {
        expect(parse(fixture)).toMatchSnapshot(fixtureName);
      });
    });
  });
});
