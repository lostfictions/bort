import { Map } from "immutable";

interface SetSeenAction {
  type: "SET_SEEN";
  username: string;
  time: number;
  message: string;
  channel: string;
}

export const setSeenAction = (
  username: string,
  message: string,
  channel: string
): SetSeenAction => ({
  type: "SET_SEEN",
  username,
  time: Date.now(),
  message,
  channel
});

export interface SeenData {
  time: number;
  message: string;
  channel: string;
}

export const seenReducers = (
  state = Map<string, SeenData>(),
  action: SetSeenAction
) => {
  switch (action.type) {
    case "SET_SEEN": {
      const { username, type, ...data } = action;
      return state.set(username, data);
    }
  }

  return state;
};
