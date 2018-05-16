import { Action, Reducer } from "redux";
import { Map, List } from "immutable";

import { ConceptBank } from "../commands/concepts";

import {
  isAddConceptAction,
  isRemoveConceptAction,
  isLoadConceptAction,
  isAddToConceptAction,
  isRemoveFromConceptAction
} from "../actions/concept";

export const conceptReducers: Reducer<ConceptBank> = (
  state: ConceptBank = Map<string, List<string>>(),
  action: Action
) => {
  if (isAddConceptAction(action)) {
    return state.set(action.conceptName, List([]));
  } else if (isRemoveConceptAction(action)) {
    return state.delete(action.conceptName);
  } else if (isLoadConceptAction(action)) {
    return state.set(action.conceptName, List(action.items));
  } else if (isAddToConceptAction(action)) {
    return state.update(action.conceptName, items => items.push(action.item));
  } else if (isRemoveFromConceptAction(action)) {
    return state.update(action.conceptName, items =>
      items.delete(items.indexOf(action.item))
    );
  }

  return state;
};
