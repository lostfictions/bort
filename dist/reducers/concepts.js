"use strict";
const immutable_1 = require("immutable");
const concept_1 = require("../actions/concept");
exports.conceptReducers = (state = immutable_1.Map(), action) => {
    if (concept_1.isAddConceptAction(action)) {
        return state.set(action.conceptName, immutable_1.List([]));
    }
    else if (concept_1.isRemoveConceptAction(action)) {
        return state.delete(action.conceptName);
    }
    else if (concept_1.isAddToConceptAction(action)) {
        return state.update(action.conceptName, items => items.push(action.item));
    }
    else if (concept_1.isRemoveFromConceptAction(action)) {
        return state.update(action.conceptName, items => items.delete(items.indexOf(action.item)));
    }
    return state;
};
