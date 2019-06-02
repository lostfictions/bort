import { IReadableStore } from "../store/store";

type TraceableStoreShape = {
  concepts: { [conceptName: string]: string[] };
};

type MarkovableStoreShape = {
  wordBank: { [word: string]: { [followedBy: string]: number } };
};

export function getMockStore() {
  return {
    async get(key) {
      switch (key) {
        case "concepts":
          return {
            xconcept: ["a"]
          };
        case "wordBank":
          return {
            aa: {
              bb: 1
            },
            bb: {
              cc: 1
            },
            cc: {},
            c_that_shouldnt_get_picked: {}
          };
        default:
          throw new Error("Unexpected store key");
      }
    }
  } as IReadableStore<TraceableStoreShape & MarkovableStoreShape>;
}
