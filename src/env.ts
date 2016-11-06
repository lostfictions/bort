import * as envalid from 'envalid'

type envSchema = {
  SLACK_TOKEN : string
  OPENSHIFT_APP_DNS : string
  OPENSHIFT_NODEJS_PORT : number
  OPENSHIFT_NODEJS_IP : string
  OPENSHIFT_DATA_DIR : string
}

export const env = envalid.cleanEnv(process.env, {
  SLACK_TOKEN: envalid.str(),
  OPENSHIFT_APP_DNS: envalid.str({ default: 'localhost' }),
  OPENSHIFT_NODEJS_PORT: envalid.num({ default: 8080 }),
  OPENSHIFT_NODEJS_IP: envalid.str({ default: 'localhost' }),
  OPENSHIFT_DATA_DIR: envalid.str({ default: 'persist' })
}) as envSchema
