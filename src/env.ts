import * as fs from 'fs'
import * as envalid from 'envalid'
import * as debug from 'debug'
const log = debug('bort:env')

interface EnvSchema {
  BOT_NAME : string
  DATA_DIR : string
  SLACK_TOKENS : string
  DISCORD_TOKEN : string
  HOSTNAME : string
  PORT : number
  USE_CLI : boolean
}

const env = envalid.cleanEnv<EnvSchema>(
  process.env,
  {
    BOT_NAME: envalid.str({ default: 'bort' }),
    DATA_DIR: envalid.str({ default: 'persist' }),
    SLACK_TOKENS: envalid.str({
      default: '',
      desc: 'A Slack API token, or a comma-separated list of Slack API tokens.'
    }),
    DISCORD_TOKEN: envalid.str({ default: '' }),
    HOSTNAME: envalid.str({ devDefault: 'localhost' }),
    PORT: envalid.num({ devDefault: 8080 }),
    USE_CLI: envalid.bool({
      default: false,
      desc: 'Start up an interface that reads from stdin and prints to stdout instead of connecting to servers.'
    })
  },
  { strict: true }
)

export const {
  BOT_NAME,
  DATA_DIR,
  SLACK_TOKENS,
  DISCORD_TOKEN,
  HOSTNAME,
  PORT,
  USE_CLI
} = env

if(!fs.existsSync(DATA_DIR)) {
  log(DATA_DIR + ' not found! creating.')
  fs.mkdirSync(DATA_DIR)
}

const isValidConfiguration = USE_CLI || SLACK_TOKENS || DISCORD_TOKEN

if(!isValidConfiguration) {
  console.warn(
    `Environment configuration doesn't appear to be valid! Bot will do nothing if you're not running in CLI mode.`
  )

  const varsToCheck : [keyof EnvSchema] = ['SLACK_TOKENS', 'DISCORD_TOKEN']
  const configInfo = varsToCheck.map(key => `${key}: ${env[key] ? 'OK' : 'NONE'}`).join('\n')
  console.warn(configInfo)
}
