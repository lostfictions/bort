"use strict";
const express = require('express');
//Open a responder we can ping (via uptimerobot.com or similar) so the OpenShift app doesn't idle
function pingserver(port, host) {
    const app = express();
    app.get('/', (req, res) => {
        res.status(200).end();
    });
    app.listen(port, host);
    return app;
}
exports.pingserver = pingserver;
