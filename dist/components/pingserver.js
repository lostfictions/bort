"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
//Open a responder we can ping (via uptimerobot.com or similar) so the OpenShift app doesn't idle
function pingserver(port, host) {
    const app = express();
    app.use(express.static(path.join(__dirname, '../../static')));
    app.get('/', (req, res) => {
        res.status(200).end();
    });
    app.listen(port, host);
    return app;
}
exports.pingserver = pingserver;
