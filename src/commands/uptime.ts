import { BOT_NAME } from '../env'
import { hostname } from 'os'
import * as moment from 'moment'
import { makeCommand } from '../util/handler'

export default makeCommand(
  {
    name: 'uptime',
    description: 'info about me'
  },
  () => {
    const uptime = moment.duration(process.uptime(), 'seconds').humanize()
    return `hi its me <@${BOT_NAME}> i have been here for *${uptime}* via \`${ hostname() }\``
  }
)
