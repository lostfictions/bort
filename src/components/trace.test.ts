import {
  trace,
  tryTrace,
  emptyConceptError,
  unknownConceptError,
  MAX_CYCLES_ERROR,
} from "./trace.ts";

import makeMockDb from "../store/mock-db.ts";

describe("tracing functions", () => {
  describe("trace", () => {
    it("performs basic replacement", async () => {
      const { db, store } = makeMockDb();

      store["concept:dog"] = { shiba: 1 };
      store["concept:cat"] = { tabby: 1 };

      const res = await trace({ db, concept: "dog" });
      expect(res).toBe("shiba");
    });

    it("performs basic recursive replacements", async () => {
      const { db, store } = makeMockDb();

      store["concept:dog"] = { shiba: 1 };
      store["concept:dogs"] = { "[dog]": 1 };

      const res = await trace({ db, concept: "dogs" });
      expect(res).toBe("shiba");
    });

    it("performs recursive replacements with multiple concepts", async () => {
      const { db, store } = makeMockDb();

      store["concept:dog"] = { shiba: 1 };
      store["concept:cat"] = { tabby: 1 };
      store["concept:animal"] = { "[dog][cat]": 1 };

      const res = await trace({ db, concept: "animal" });
      expect(res).toBe("shibatabby");
    });

    it("performs deeper recursive replacements", async () => {
      const { db, store } = makeMockDb();

      store["concept:dog"] = { shiba: 1 };
      store["concept:cat"] = { tabby: 1 };
      store["concept:beast"] = { "![dog]!": 1 };
      store["concept:animal"] = { "[beast]/[cat]": 1 };

      const res = await trace({ db, concept: "animal" });
      expect(res).toBe("!shiba!/tabby");
    });

    it("returns an error when max cycles exceeded", async () => {
      const { db, store } = makeMockDb();

      store["concept:dog"] = { "[beast]": 1 };
      store["concept:cat"] = { tabby: 1 };
      store["concept:beast"] = { "[dog]": 1 };
      store["concept:animal"] = { "[beast]/[cat]": 1 };

      const res = await trace({ db, concept: "animal" });
      expect(res).toBe(`${MAX_CYCLES_ERROR}/tabby`);
    });

    it("returns an error when empty concept encountered", async () => {
      const { db, store } = makeMockDb();

      store["concept:dog"] = {};
      store["concept:cat"] = { tabby: 1 };
      store["concept:beast"] = { "[dog]": 1 };
      store["concept:animal"] = { "[beast]/[cat]": 1 };

      const res = await trace({ db, concept: "animal" });
      expect(res).toBe(`${emptyConceptError("dog")}/tabby`);
    });

    it("returns an error when unknown concept encountered", async () => {
      const { db, store } = makeMockDb();

      store["concept:cat"] = { tabby: 1 };
      store["concept:beast"] = { "[dog]": 1 };
      store["concept:animal"] = { "[beast]/[cat]": 1 };

      const res = await trace({ db, concept: "animal" });
      expect(res).toBe(`${unknownConceptError("dog")}/tabby`);
    });
  });

  describe("tryTrace", () => {
    it("returns replacement when a sentence matches", async () => {
      const { db, store } = makeMockDb();

      store["concept:dog"] = { shiba: 1 };
      store["concept:cat"] = { tabby: 1 };

      const res = await tryTrace(db, "i love this [dog]");
      expect(res).toBe("i love this shiba");
    });

    it("returns false when no concepts in message", async () => {
      const { db, store } = makeMockDb();

      store["concept:dog"] = { shiba: 1 };
      store["concept:dogs"] = { "[dog]": 1 };

      const res = await tryTrace(db, "i love this dog");
      expect(res).toBe(false);
    });
  });
});
