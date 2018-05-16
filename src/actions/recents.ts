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
export function isAddRecentAction(action: {
  type: string;
}): action is AddRecentAction {
  return action.type === "ADD_RECENT";
}

export const cleanRecentsAction = (
  olderThanMinutes: number = 60
): CleanRecentsAction => ({
  type: "CLEAN_RECENTS",
  olderThan: Date.now() - olderThanMinutes * 60000
});
export function isCleanRecentsAction(action: {
  type: string;
}): action is CleanRecentsAction {
  return action.type === "CLEAN_RECENTS";
}
