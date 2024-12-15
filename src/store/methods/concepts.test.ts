import {
  addConcept,
  removeConcept,
  addToConcept,
  removeFromConcept,
  getConceptList,
} from "./concepts.ts";

import makeMockDb from "../mock-db.ts";

describe("db concepts", () => {
  it("adds a concept 1", async () => {
    const { db, store } = makeMockDb();

    await addConcept(db, "dogs");

    expect(store).toEqual({
      "concept:dogs": {},
    });
  });

  it("adds a concept 2", async () => {
    const { db, store } = makeMockDb({
      "concept:cats": { tabby: 1 },
    });

    await addConcept(db, "dogs");

    expect(store).toEqual({ "concept:cats": { tabby: 1 }, "concept:dogs": {} });
  });

  it("adds a concept 3", async () => {
    const { db, store } = makeMockDb({
      "concept:cats": { tabby: 1 },
    });

    await addConcept(db, "dogs", ["pug", "weiner"]);

    expect(store).toEqual({
      "concept:cats": { tabby: 1 },
      "concept:dogs": { pug: 1, weiner: 1 },
    });
  });

  it("preserves existing values when adding a concept without overwrite", async () => {
    const { db, store } = makeMockDb({
      "concept:cats": { tabby: 1 },
    });

    const res = await addConcept(db, "cats");

    expect(res).toBe(false);
    expect(store).toEqual({ "concept:cats": { tabby: 1 } });
  });

  it("replaces existing values when adding a concept with overwrite 1", async () => {
    const { db, store } = makeMockDb({
      "concept:cats": { tabby: 1 },
    });

    const res = await addConcept(db, "cats", undefined, true);

    expect(res).toBe(true);
    expect(store).toEqual({ "concept:cats": {} });
  });

  it("replaces existing values when adding a concept with overwrite 2", async () => {
    const { db, store } = makeMockDb({
      "concept:cats": { tabby: 1 },
    });

    const res = await addConcept(db, "cats", ["garfield"], true);

    expect(res).toBe(true);
    expect(store).toEqual({ "concept:cats": { garfield: 1 } });
  });

  it("removes a concept 1", async () => {
    const { db, store } = makeMockDb({
      "concept:dogs": { shiba: 1, labrador: 1 },
    });

    await removeConcept(db, "dogs");

    expect(store).toEqual({});
  });

  it("removes a concept 2", async () => {
    const { db, store } = makeMockDb({
      "concept:dogs": { shiba: 1, labrador: 1 },
      "concept:cats": { tabby: 1 },
    });

    await removeConcept(db, "cats");

    expect(store).toEqual({
      "concept:dogs": { shiba: 1, labrador: 1 },
    });
  });

  it("adds to a concept 1", async () => {
    const { db, store } = makeMockDb({
      "concept:dogs": {},
    });

    await addToConcept(db, "dogs", ["shiba"]);

    expect(store).toEqual({
      "concept:dogs": { shiba: 1 },
    });
  });

  it("adds to a concept 2", async () => {
    const { db, store } = makeMockDb({
      "concept:cats": { tabby: 1 },
      "concept:dogs": { lab: 1 },
    });

    await addToConcept(db, "dogs", ["shiba"]);

    expect(store).toEqual({
      "concept:cats": { tabby: 1 },
      "concept:dogs": { lab: 1, shiba: 1 },
    });
  });

  it("removes from a concept 1", async () => {
    const { db, store } = makeMockDb({
      "concept:dogs": { lab: 1 },
    });

    await removeFromConcept(db, "dogs", ["lab"]);

    expect(store).toEqual({
      "concept:dogs": {},
    });
  });

  it("removes from a concept 2", async () => {
    const { db, store } = makeMockDb({
      "concept:cats": { tabby: 1 },
      "concept:dogs": { shiba: 1, lab: 1 },
    });

    await removeFromConcept(db, "dogs", ["shiba"]);

    expect(store).toEqual({
      "concept:cats": { tabby: 1 },
      "concept:dogs": { lab: 1 },
    });
  });

  it("gets a concept list", async () => {
    const { db } = makeMockDb({
      whatever: {},
      "concept:cats": { tabby: 1 },
      "another thing": {},
      "conceptual art": {},
      "concept:dogs": { shiba: 1, lab: 1 },
    });

    const concepts = await getConceptList(db);

    expect(concepts).toEqual(["cats", "dogs"]);
  });
});
