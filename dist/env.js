"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const envalid = require("envalid");
exports.env = envalid.cleanEnv(process.env, {
    DATA_DIR: envalid.str({ default: 'persist' }),
    SLACK_TOKEN: envalid.str(),
    DISCORD_TOKEN: envalid.str(),
    OPENSHIFT_APP_DNS: envalid.str({ default: 'localhost' }),
    OPENSHIFT_NODEJS_PORT: envalid.num({ default: 8080 }),
    OPENSHIFT_NODEJS_IP: envalid.str({ default: 'localhost' })
});
