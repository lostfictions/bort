import { Action, Reducer } from "redux";
import { Map } from "immutable";

import { isAddRecentAction, isCleanRecentsAction } from "../actions/recents";

export const recentsReducers: Reducer<Map<string, number>> = (
  state = Map<string, number>(),
  action: Action
) => {
  if (isAddRecentAction(action)) {
    return state.set(action.item, action.time);
  } else if (isCleanRecentsAction(action)) {
    return state.filter(time => (time || 0) - action.olderThan > 0) as Map<
      string,
      number
    >;
  }

  return state;
};
