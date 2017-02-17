interface AddSentenceAction {
  type : 'ADD_SENTENCE'
  sentence : string
}

export const addSentenceAction = (sentence : string) : AddSentenceAction => ({ type : 'ADD_SENTENCE', sentence })

export function isAddSentenceAction(action : { type : string }) : action is AddSentenceAction {
  return action.type === 'ADD_SENTENCE'
}
