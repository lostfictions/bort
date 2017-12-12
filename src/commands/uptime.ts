import { hostname } from 'os'
import * as moment from 'moment'
import { createCommand } from 'chatter'

import { AdjustedArgs } from './AdjustedArgs'

export default createCommand(
  {
    name: 'uptime',
    description: 'info about me'
  },
  (_ : any, { botName } : AdjustedArgs) => {
    const uptime = moment.duration(process.uptime(), 'seconds').humanize()
    return `hi its me <@${ botName }> i have been here for *${uptime}* via \`${ hostname() }\``
  }
)
