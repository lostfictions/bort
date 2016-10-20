"use strict";
const envalid = require('envalid');
exports.env = envalid.cleanEnv(process.env, {
    SLACK_TOKEN: envalid.str(),
    OPENSHIFT_NODEJS_PORT: envalid.num({ default: 8080 }),
    OPENSHIFT_NODEJS_IP: envalid.str({ default: 'localhost' })
});
