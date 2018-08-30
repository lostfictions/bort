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
  state: ConceptBank = {},
  action: ConceptAction
): ConceptBank => {
  switch (action.type) {
    case "ADD_CONCEPT":
      return { ...state, [action.conceptName]: [] };
    case "REMOVE_CONCEPT": {
      const { [action.conceptName]: _, ...nextState } = state;
      return nextState;
    }
    case "LOAD_CONCEPT":
      return { ...state, [action.conceptName]: action.items };
    case "ADD_TO_CONCEPT":
      return {
        ...state,
        [action.conceptName]: [...state[action.conceptName], action.item]
      };
    case "REMOVE_FROM_CONCEPT": {
      const nextConcept = [...state[action.conceptName]];
      nextConcept.splice(nextConcept.indexOf(action.item), 1);
      return { ...state, [action.conceptName]: nextConcept };
    }
    default:
      return state;
  }
};
