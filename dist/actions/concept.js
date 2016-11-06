"use strict";
exports.addConceptAction = (conceptName) => ({ type: 'ADD_CONCEPT', conceptName });
function isAddConceptAction(action) {
    return action.type === 'ADD_CONCEPT';
}
exports.isAddConceptAction = isAddConceptAction;
exports.removeConceptAction = (conceptName) => ({ type: 'REMOVE_CONCEPT', conceptName });
function isRemoveConceptAction(action) {
    return action.type === 'REMOVE_CONCEPT';
}
exports.isRemoveConceptAction = isRemoveConceptAction;
exports.addToConceptAction = (conceptName, item) => ({ type: 'ADD_TO_CONCEPT', conceptName, item });
function isAddToConceptAction(action) {
    return action.type === 'ADD_TO_CONCEPT';
}
exports.isAddToConceptAction = isAddToConceptAction;
exports.removeFromConceptAction = (conceptName, item) => ({ type: 'REMOVE_FROM_CONCEPT', conceptName, item });
function isRemoveFromConceptAction(action) {
    return action.type === 'REMOVE_FROM_CONCEPT';
}
exports.isRemoveFromConceptAction = isRemoveFromConceptAction;
