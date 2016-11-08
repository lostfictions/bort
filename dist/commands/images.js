"use strict";
const chatter_1 = require('chatter');
const imageSearch = require('g-i-s');
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = chatter_1.createCommand({
    name: 'image',
    aliases: [`what's a`, `what's`, `who's`, 'show me'],
    description: 'i will show you'
}, (message) => new Promise((resolve, reject) => {
    imageSearch({
        searchTerm: message,
        queryStringAddition: '&nfpr=1' //exact search, don't correct typos
    }, (error, results) => {
        if (error != null) {
            return reject(error);
        }
        if (results.length === 0 || results[0].url.length === 0) {
            return reject('Invalid search result!');
        }
        resolve(results[0].url);
    });
}));
