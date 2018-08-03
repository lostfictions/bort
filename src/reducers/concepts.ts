import { Map, List } from "immutable";

import { ConceptBank } from "../commands/concepts";

interface AddConceptAction {
  type: "ADD_CONCEPT";
  conceptName: string;
}

interface RemoveConceptAction {
  type: "REMOVE_CONCEPT";
  conceptName: string;
}

interface LoadConceptAction {
  type: "LOAD_CONCEPT";
  conceptName: string;
  items: string[];
}

interface AddToConceptAction {
  type: "ADD_TO_CONCEPT";
  conceptName: string;
  item: string;
}

interface RemoveFromConceptAction {
  type: "REMOVE_FROM_CONCEPT";
  conceptName: string;
  item: string;
}

export const addConceptAction = (conceptName: string): AddConceptAction => ({
  type: "ADD_CONCEPT",
  conceptName
});

export const removeConceptAction = (
  conceptName: string
): RemoveConceptAction => ({ type: "REMOVE_CONCEPT", conceptName });

export const loadConceptAction = (
  conceptName: string,
  items: string[]
): LoadConceptAction => ({ type: "LOAD_CONCEPT", conceptName, items });

export const addToConceptAction = (
  conceptName: string,
  item: string
): AddToConceptAction => ({ type: "ADD_TO_CONCEPT", conceptName, item });

export const removeFromConceptAction = (
  conceptName: string,
  item: string
): RemoveFromConceptAction => ({
  type: "REMOVE_FROM_CONCEPT",
  conceptName,
  item
});

type ConceptAction =
  | AddConceptAction
  | RemoveConceptAction
  | LoadConceptAction
  | AddToConceptAction
  | RemoveFromConceptAction;

export const conceptReducers = (
  state: ConceptBank = Map(),
  action: ConceptAction
) => {
  switch (action.type) {
    case "ADD_CONCEPT":
      return state.set(action.conceptName, List([]));
    case "REMOVE_CONCEPT":
      return state.delete(action.conceptName);
    case "LOAD_CONCEPT":
      return state.set(action.conceptName, List(action.items));
    case "ADD_TO_CONCEPT":
      return state.update(action.conceptName, items => items.push(action.item));
    case "REMOVE_FROM_CONCEPT":
      return state.update(action.conceptName, items =>
        items.delete(items.indexOf(action.item))
      );
  }
  return state;
};
