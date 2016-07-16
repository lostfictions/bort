import * as envalid from 'envalid'

type envSchema = {
  SLACK_TOKEN: string,
  GOOGLE_PRIVATE_KEY: string,
  GOOGLE_CLIENT_EMAIL: string,
  GOOGLE_SHEET_ID: string,
  OPENSHIFT_NODEJS_PORT: number,
  OPENSHIFT_NODEJS_IP: string,
  NGRAM_LENGTH: number
}

export const env = envalid.cleanEnv(process.env, {
  SLACK_TOKEN: envalid.str(),
  GOOGLE_PRIVATE_KEY: envalid.str(),
  GOOGLE_CLIENT_EMAIL: envalid.email(),
  GOOGLE_SHEET_ID: envalid.str(),
  OPENSHIFT_NODEJS_PORT: envalid.num({ default: 8080 }),
  OPENSHIFT_NODEJS_IP: envalid.str({ default: 'localhost' }),
  NGRAM_LENGTH: envalid.num({ default: 2 })
}) as envSchema
