import * as fs from 'fs'
import * as envalid from 'envalid'
import * as debug from 'debug'
const log = debug('bort:env')


const env = envalid.cleanEnv(
  process.env,
  {
    BOT_NAME: envalid.str({ default: 'bort' }),
    DATA_DIR: envalid.str({ default: 'persist' }),
    DISCORD_TOKEN: envalid.str({ default: '' }),
    OPEN_WEATHER_MAP_KEY: envalid.str({ default: '' }),
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
  DISCORD_TOKEN,
  OPEN_WEATHER_MAP_KEY,
  HOSTNAME,
  PORT,
  USE_CLI
} = env

if(!fs.existsSync(DATA_DIR)) {
  log(DATA_DIR + ' not found! creating.')
  fs.mkdirSync(DATA_DIR)
}

const isValidConfiguration = USE_CLI || DISCORD_TOKEN;

if(!isValidConfiguration) {
  console.warn(
    `Environment configuration doesn't appear to be valid! Bot will do nothing if you're not running in CLI mode.`
  )

  const configInfo = varsToCheck.map(key => `${key}: ${(env as any)[key] ? 'OK' : 'NONE'}`).join('\n')
  console.warn(configInfo)
  const varsToCheck = ["DISCORD_TOKEN"];
}
