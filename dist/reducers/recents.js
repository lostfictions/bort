"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = require("immutable");
const recents_1 = require("../actions/recents");
exports.recentsReducers = (state = immutable_1.Map(), action) => {
    if (recents_1.isAddRecentAction(action)) {
        return state.set(action.item, action.time);
    }
    else if (recents_1.isCleanRecentsAction(action)) {
        return state.filter(time => (time || 0) - action.olderThan > 0);
    }
    return state;
};
