import * as envalid from 'envalid'

type envSchema = {
  DATA_DIR : string
  SLACK_TOKEN : string
  DISCORD_TOKEN : string
  OPENSHIFT_APP_DNS : string
  OPENSHIFT_NODEJS_PORT : number
  OPENSHIFT_NODEJS_IP : string
}

export const env = envalid.cleanEnv(process.env, {
  DATA_DIR: envalid.str({ default: 'persist' }),
  SLACK_TOKEN: envalid.str(),
  DISCORD_TOKEN: envalid.str(),
  OPENSHIFT_APP_DNS: envalid.str({ default: 'localhost' }),
  OPENSHIFT_NODEJS_PORT: envalid.num({ default: 8080 }),
  OPENSHIFT_NODEJS_IP: envalid.str({ default: 'localhost' })
}) as envSchema
