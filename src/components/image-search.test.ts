import { readFileSync, readdirSync } from "fs";
import { join } from "path";

import { imageSearch, parse } from "./image-search";

const fixturePath = join(__dirname, `../../fixtures/image-search`);
const fixtureFiles = readdirSync(fixturePath);

const fixtures = fixtureFiles.map(f => [
  readFileSync(join(fixturePath, f), "utf8"),
  f
]);

// const mockResponses = {
//   "1": loadFixture(1),
//   "2": loadFixture(2),
//   "3": loadFixture(3)
// };

// jest.mock("axios", () =>
//   jest.fn(async (url: string) => {
//     if (url.endsWith("1")) return { data: mockResponses["1"] };
//     if (url.endsWith("2")) return { data: mockResponses["2"] };
//     if (url.endsWith("3")) return { data: mockResponses["3"] };
//     throw new Error(`Unexpected url calling mocked axios: ${url}`);
//   })
// );

describe("image search", () => {
  describe("parse", () => {
    it("matches snapshots from fixture data", () => {
      fixtures.forEach(([fixture, fixtureName]) => {
        expect(parse(fixture)).toMatchSnapshot(fixtureName);
      });
    });
  });
});
