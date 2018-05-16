import { Action, Reducer } from "redux";
import { Map } from "immutable";

import { isSetSeenAction } from "../actions/seen";

export interface SeenData {
  time: number;
  message: string;
  channel: string;
}

export const seenReducers: Reducer<Map<string, SeenData>> = (
  state = Map<string, SeenData>(),
  action: Action
) => {
  if (isSetSeenAction(action)) {
    const { username, type, ...data } = action;
    return state.set(username, data);
  }

  return state;
};
