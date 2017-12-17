import { makeCommand } from '../util/handler'
import { Map } from 'immutable'

import { HandlerArgs } from './HandlerArgs'


export default makeCommand<HandlerArgs>(
  {
    name: 'seen',
    description: 'note when the given user was last seen'
  },
  ({ message, store, channel }) => {
    const seen = store.getState().get('seen')

    const username = message.trim().toLowerCase()

    const data = seen.get(username)
    if(!data) {
      return `Unknown username: "${username}"`
    }

    return 'todo'
  }
)
