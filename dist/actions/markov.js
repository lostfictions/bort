"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSentenceAction = (sentence) => ({ type: 'ADD_SENTENCE', sentence });
function isAddSentenceAction(action) {
    return action.type === 'ADD_SENTENCE';
}
exports.isAddSentenceAction = isAddSentenceAction;
