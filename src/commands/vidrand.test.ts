import { readFileSync } from "fs";
import { join } from "path";

import command, { getFilmUrlsFromLetterboxdList, USAGE } from "./vidrand";

const loadFixture = (page: number) =>
  readFileSync(
    join(__dirname, `../../fixtures/vidrand/letterboxd-response-${page}.html`),
  ).toString();

const mockResponses = {
  "1": loadFixture(1),
  "2": loadFixture(2),
  "3": loadFixture(3),
};

jest.mock("axios", () =>
  jest.fn(async (url: string) => {
    if (url.endsWith("1")) return { data: mockResponses["1"] };
    if (url.endsWith("2")) return { data: mockResponses["2"] };
    if (url.endsWith("3")) return { data: mockResponses["3"] };
    throw new Error(`Unexpected url calling mocked axios: ${url}`);
  }),
);

describe("vidrand", () => {
  describe("getFilmUrlsFromLetterboxdList", () => {
    it("should parse the response and return valid results", async () => {
      const urls = await getFilmUrlsFromLetterboxdList("whatever");

      // results from both pages! (the last page is empty)
      expect(urls).toContain("the-age-of-consent");
      expect(urls).toContain("boesman-and-lena");
      expect(urls).toContain("ouch");

      expect((urls as string[]).length).toBeGreaterThan(70);
    });
  });

  describe("vidrand command", () => {
    it("should return usage on invalid input", async () => {
      const result = await command.handleMessage({
        message: "vidrand whatever",
      } as any);
      expect(result).toBe(USAGE);
    });

    it("should call through to getFilmUrls when letterboxd url is passed", async () => {
      const result = await command.handleMessage({
        message: "vidrand https://letterboxd.com/someuser/watchlist",
      } as any);

      const axiosMock = jest.requireMock("axios");
      expect(axiosMock).toHaveBeenCalled();

      expect(typeof result).toBe("string");
      expect((result as string).startsWith("https://letterboxd.com/film")).toBe(
        true,
      );
    });
  });
});
