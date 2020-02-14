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
  channel: string,
  time = Date.now()
): SetSeenAction => ({
  type: "SET_SEEN",
  username,
  time,
  message,
  channel
});

export interface SeenData {
  time: number;
  message: string;
  channel: string;
}

export const seenReducers = (
  state: { [username: string]: SeenData } = {},
  action: SetSeenAction
) => {
  switch (action.type) {
    case "SET_SEEN": {
      const { username, type, ...data } = action;
      return { ...state, [username]: data };
    }
    default:
      return state;
  }
};
