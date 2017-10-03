import * as envalid from 'envalid'

type envSchema = {
  DATA_DIR : string
  SLACK_TOKEN : string
  DISCORD_TOKEN : string
  HOSTNAME : string
  PORT : number
  OPENSHIFT_NODEJS_IP : string
}

export const env = envalid.cleanEnv(process.env, {
  DATA_DIR: envalid.str({ default: 'persist' }),
  SLACK_TOKEN: envalid.str(),
  DISCORD_TOKEN: envalid.str(),
  HOSTNAME: envalid.str({ default: 'localhost' }),
  PORT: envalid.num({ default: 8080 }),
  OPENSHIFT_NODEJS_IP: envalid.str({ default: 'localhost' })
}) as envSchema
