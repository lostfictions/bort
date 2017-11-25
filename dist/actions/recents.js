"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRecentAction = (item) => ({ type: 'ADD_RECENT', item, time: Date.now() });
function isAddRecentAction(action) {
    return action.type === 'ADD_RECENT';
}
exports.isAddRecentAction = isAddRecentAction;
exports.cleanRecentsAction = (olderThanMinutes = 60) => ({ type: 'CLEAN_RECENTS', olderThan: Date.now() - olderThanMinutes * 60000 });
function isCleanRecentsAction(action) {
    return action.type === 'CLEAN_RECENTS';
}
exports.isCleanRecentsAction = isCleanRecentsAction;
//# sourceMappingURL=recents.js.map