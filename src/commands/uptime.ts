import { hostname } from 'os'
import * as moment from 'moment'
import { createCommand } from 'chatter'

import { AdjustedArgs } from './AdjustedArgs'

export default createCommand(
  {
    name: 'uptime',
    description: 'info about me'
  },
  (_ : any, { name } : AdjustedArgs) => {
    const uptime = moment.duration(process.uptime(), 'seconds').humanize()
    return `hi its me <@${ name }> i have been here for *${uptime}* via \`${ hostname() }\``
  }
)
