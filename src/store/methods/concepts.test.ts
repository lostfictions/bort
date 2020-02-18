import {
  addConcept,
  removeConcept,
  addToConcept,
  removeFromConcept,
  getConceptList
} from "./concepts";

import makeMockDb from "../mock-db";

describe("db concepts", () => {
  test("add concept 1", async () => {
    const { db, store } = makeMockDb();

    await addConcept(db, "dogs");

    expect(store).toEqual({
      "concept:dogs": {}
    });
  });

  test("add concept 2", async () => {
    const { db, store } = makeMockDb();

    store["concept:cats"] = { tabby: 1 };

    await addConcept(db, "dogs");

    expect(store).toEqual({ "concept:cats": { tabby: 1 }, "concept:dogs": {} });
  });

  test("add concept 3", async () => {
    const { db, store } = makeMockDb();

    store["concept:cats"] = { tabby: 1 };

    await addConcept(db, "dogs", ["pug", "weiner"]);

    expect(store).toEqual({
      "concept:cats": { tabby: 1 },
      "concept:dogs": { pug: 1, weiner: 1 }
    });
  });

  test("add concept without overwrite should not replace existing", async () => {
    const { db, store } = makeMockDb();

    store["concept:cats"] = { tabby: 1 };

    const res = await addConcept(db, "cats");

    expect(res).toBe(false);
    expect(store).toEqual({ "concept:cats": { tabby: 1 } });
  });

  test("add concept with overwrite should replace existing 1", async () => {
    const { db, store } = makeMockDb();

    store["concept:cats"] = { tabby: 1 };

    const res = await addConcept(db, "cats", undefined, true);

    expect(res).toBe(true);
    expect(store).toEqual({ "concept:cats": {} });
  });

  test("add concept with overwrite should replace existing 2", async () => {
    const { db, store } = makeMockDb();

    store["concept:cats"] = { tabby: 1 };

    const res = await addConcept(db, "cats", ["garfield"], true);

    expect(res).toBe(true);
    expect(store).toEqual({ "concept:cats": { garfield: 1 } });
  });

  test("remove concept 1", async () => {
    const { db, store } = makeMockDb();

    store["concept:dogs"] = { shiba: 1, labrador: 1 };

    await removeConcept(db, "dogs");

    expect(store).toEqual({});
  });

  test("remove concept 2", async () => {
    const { db, store } = makeMockDb();

    store["concept:dogs"] = { shiba: 1, labrador: 1 };
    store["concept:cats"] = { tabby: 1 };

    await removeConcept(db, "cats");

    expect(store).toEqual({
      "concept:dogs": { shiba: 1, labrador: 1 }
    });
  });

  test("add to concept 1", async () => {
    const { db, store } = makeMockDb();

    store["concept:dogs"] = {};

    await addToConcept(db, "dogs", ["shiba"]);

    expect(store).toEqual({
      "concept:dogs": { shiba: 1 }
    });
  });

  test("add to concept 2", async () => {
    const { db, store } = makeMockDb();

    store["concept:cats"] = { tabby: 1 };
    store["concept:dogs"] = { lab: 1 };

    await addToConcept(db, "dogs", ["shiba"]);

    expect(store).toEqual({
      "concept:cats": { tabby: 1 },
      "concept:dogs": { lab: 1, shiba: 1 }
    });
  });

  test("remove from concept 1", async () => {
    const { db, store } = makeMockDb();

    store["concept:dogs"] = { lab: 1 };

    await removeFromConcept(db, "dogs", ["lab"]);

    expect(store).toEqual({
      "concept:dogs": {}
    });
  });

  test("remove from concept 2", async () => {
    const { db, store } = makeMockDb();

    store["concept:cats"] = { tabby: 1 };
    store["concept:dogs"] = { shiba: 1, lab: 1 };

    await removeFromConcept(db, "dogs", ["shiba"]);

    expect(store).toEqual({
      "concept:cats": { tabby: 1 },
      "concept:dogs": { lab: 1 }
    });
  });

  test("get concept list", async () => {
    const { db, store } = makeMockDb();

    store["whatever"] = {};
    store["concept:cats"] = { tabby: 1 };
    store["another thing"] = {};
    store["conceptual art"] = {};
    store["concept:dogs"] = { shiba: 1, lab: 1 };

    const concepts = await getConceptList(db);

    expect(concepts).toEqual(["cats", "dogs"]);
  });
});
