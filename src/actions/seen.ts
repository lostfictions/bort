interface SetSeenAction {
  type : 'SET_SEEN'
  username : string
  time : number
  message : string
  channel : string
}

export const setSeenAction = (username : string, message : string, channel : string) : SetSeenAction =>
  ({ type: 'SET_SEEN', username, time: Date.now(), message, channel })
export function isSetSeenAction(action : { type : string }) : action is SetSeenAction {
  return action.type === 'SET_SEEN'
}
