"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const envalid = require("envalid");
exports.env = envalid.cleanEnv(process.env, {
    DATA_DIR: envalid.str({ default: 'persist' }),
    SLACK_TOKEN: envalid.str(),
    DISCORD_TOKEN: envalid.str(),
    HOSTNAME: envalid.str({ default: 'localhost' }),
    PORT: envalid.num({ default: 8080 }),
    OPENSHIFT_NODEJS_IP: envalid.str({ default: 'localhost' })
});
