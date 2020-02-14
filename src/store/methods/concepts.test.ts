import {
  conceptReducers,
  addConceptAction,
  removeConceptAction,
  loadConceptAction,
  addToConceptAction,
  removeFromConceptAction
} from "./concepts";

describe("concept reducers", () => {
  test("add concept action", () => {
    expect(conceptReducers({}, addConceptAction("dogs"))).toEqual({
      dogs: []
    });

    expect(
      conceptReducers({ cats: ["tabby"] }, addConceptAction("dogs"))
    ).toEqual({ cats: ["tabby"], dogs: [] });
  });

  test("remove concept action", () => {
    expect(
      conceptReducers(
        { dogs: ["shiba", "labrador"] },
        removeConceptAction("dogs")
      )
    ).toEqual({});

    expect(
      conceptReducers(
        { dogs: ["shiba", "labrador"], cats: ["tabby"] },
        removeConceptAction("cats")
      )
    ).toEqual({
      dogs: ["shiba", "labrador"]
    });
  });

  test("load concept action", () => {
    expect(
      conceptReducers({}, loadConceptAction("dogs", ["shiba", "lab"]))
    ).toEqual({
      dogs: ["shiba", "lab"]
    });

    expect(
      conceptReducers(
        { cats: ["tabby"], dogs: ["corgi"] },
        loadConceptAction("dogs", ["shiba", "lab"])
      )
    ).toEqual({ cats: ["tabby"], dogs: ["shiba", "lab"] });
  });

  test("add to concept action", () => {
    expect(
      conceptReducers({ dogs: [] }, addToConceptAction("dogs", "shiba"))
    ).toEqual({
      dogs: ["shiba"]
    });

    expect(
      conceptReducers(
        { cats: ["tabby"], dogs: ["lab"] },
        addToConceptAction("dogs", "shiba")
      )
    ).toEqual({ cats: ["tabby"], dogs: ["lab", "shiba"] });
  });

  test("remove from concept action", () => {
    expect(
      conceptReducers(
        { dogs: ["shiba"] },
        removeFromConceptAction("dogs", "shiba")
      )
    ).toEqual({
      dogs: []
    });

    expect(
      conceptReducers(
        { cats: ["tabby"], dogs: ["shiba", "lab"] },
        removeFromConceptAction("dogs", "shiba")
      )
    ).toEqual({ cats: ["tabby"], dogs: ["lab"] });
  });
});
