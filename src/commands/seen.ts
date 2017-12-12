import { createCommand } from 'chatter'
import { Map } from 'immutable'

import { AdjustedArgs } from './AdjustedArgs'


export default createCommand(
  {
    name: 'seen',
    description: 'note when the given user was last seen'
  },
  (message : string, { store } : AdjustedArgs) => {
    const seen = store.getState().get('seen')

    const username = message.trim().toLowerCase()

    const data = seen.get(username)
    if(!data) {
      return `Unknown username: "${username}"`
    }

    return 'todo'
  }
)
