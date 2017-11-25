interface AddConceptAction {
  type : 'ADD_CONCEPT'
  conceptName : string
}

interface RemoveConceptAction {
  type : 'REMOVE_CONCEPT'
  conceptName : string
}

interface LoadConceptAction {
  type : 'LOAD_CONCEPT'
  conceptName : string
  items : string[]
}

interface AddToConceptAction {
  type : 'ADD_TO_CONCEPT'
  conceptName : string
  item : string
}

interface RemoveFromConceptAction {
  type : 'REMOVE_FROM_CONCEPT'
  conceptName : string
  item : string
}

export const addConceptAction =
  (conceptName : string) : AddConceptAction => ({ type : 'ADD_CONCEPT', conceptName })
export function isAddConceptAction(action : { type : string }) : action is AddConceptAction {
  return action.type === 'ADD_CONCEPT'
}

export const removeConceptAction =
  (conceptName : string) : RemoveConceptAction => ({ type : 'REMOVE_CONCEPT', conceptName })
export function isRemoveConceptAction(action : { type : string }) : action is RemoveConceptAction {
  return action.type === 'REMOVE_CONCEPT'
}

export const loadConceptAction = (conceptName : string, items : string[])
  : LoadConceptAction => ({ type : 'LOAD_CONCEPT', conceptName, items })
export function isLoadConceptAction(action : { type : string }) : action is LoadConceptAction {
  return action.type === 'LOAD_CONCEPT'
}

export const addToConceptAction = (conceptName : string, item : string)
  : AddToConceptAction => ({ type : 'ADD_TO_CONCEPT', conceptName, item })
export function isAddToConceptAction(action : { type : string }) : action is AddToConceptAction {
  return action.type === 'ADD_TO_CONCEPT'
}

export const removeFromConceptAction = (conceptName : string, item : string)
  : RemoveFromConceptAction => ({ type : 'REMOVE_FROM_CONCEPT', conceptName, item })
export function isRemoveFromConceptAction(action : { type : string }) : action is RemoveFromConceptAction {
  return action.type === 'REMOVE_FROM_CONCEPT'
}
