import { Map } from "immutable";

interface AddRecentAction {
  type: "ADD_RECENT";
  item: string;
  time: number;
}

interface CleanRecentsAction {
  type: "CLEAN_RECENTS";
  olderThan: number;
}

export const addRecentAction = (item: string): AddRecentAction => ({
  type: "ADD_RECENT",
  item,
  time: Date.now()
});

export const cleanRecentsAction = (
  olderThanMinutes: number = 60
): CleanRecentsAction => ({
  type: "CLEAN_RECENTS",
  olderThan: Date.now() - olderThanMinutes * 60000
});

type RecentsAction = AddRecentAction | CleanRecentsAction;

export const recentsReducers = (
  state = Map<string, number>(),
  action: RecentsAction
) => {
  switch (action.type) {
    case "ADD_RECENT":
      return state.set(action.item, action.time);
    case "CLEAN_RECENTS":
      return state.filter(time => (time || 0) - action.olderThan > 0);
  }

  return state;
};
