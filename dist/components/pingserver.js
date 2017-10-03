"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
// Open a responder we can ping (via uptimerobot.com or similar) for status
// and serving static files
function pingserver(port) {
    const app = express();
    app.use(express.static(path.join(__dirname, '../../static')));
    app.get('/', (req, res) => {
        res.status(200).end();
    });
    app.listen(port);
    return app;
}
exports.pingserver = pingserver;
