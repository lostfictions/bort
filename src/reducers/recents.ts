interface AddRecentAction {
  type: "ADD_RECENT";
  item: string;
  time: number;
}

interface CleanRecentsAction {
  type: "CLEAN_RECENTS";
  olderThan: number;
}

export const addRecentAction = (
  item: string,
  time = Date.now()
): AddRecentAction => ({
  type: "ADD_RECENT",
  item,
  time
});

export const cleanRecentsAction = (
  olderThanMinutes: number = 60
): CleanRecentsAction => ({
  type: "CLEAN_RECENTS",
  olderThan: Date.now() - olderThanMinutes * 60000
});

type RecentsAction = AddRecentAction | CleanRecentsAction;

export const recentsReducers = (
  state: { [username: string]: number } = {},
  action: RecentsAction
) => {
  switch (action.type) {
    case "ADD_RECENT":
      return { ...state, [action.item]: action.time };
    case "CLEAN_RECENTS": {
      const nextState: { [username: string]: number } = {};
      for (const [username, lastSeen] of Object.entries(state)) {
        if ((lastSeen || 0) - action.olderThan > 0) {
          nextState[username] = lastSeen;
        }
      }
      return nextState;
    }
    default:
      return state;
  }
};
