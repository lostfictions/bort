import { Action, Reducer } from 'redux'
import { Map } from 'immutable'

import {
  isSetSeenAction
} from '../actions/seen'


export const seenReducers : Reducer<Map<string, [string, number]>> =
  (state = Map<string, [string, number]>(), action : Action) =>
{
  if(isSetSeenAction(action)) {
    return state.set(action.username, [action.message, action.time])
  }

  return state
}
