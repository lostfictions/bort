import * as envalid from 'envalid'

type envSchema = {
  SLACK_TOKEN: string,
  OPENSHIFT_NODEJS_PORT: number,
  OPENSHIFT_NODEJS_IP: string
}

export const env = envalid.cleanEnv(process.env, {
  SLACK_TOKEN: envalid.str(),
  OPENSHIFT_NODEJS_PORT: envalid.num({ default: 8080 }),
  OPENSHIFT_NODEJS_IP: envalid.str({ default: 'localhost' })
}) as envSchema
