"use strict";
const chatter_1 = require('chatter');
const got = require('got');
const cheerio = require('cheerio');
const util_1 = require('../util/util');
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = chatter_1.createCommand({
    name: 'image',
    aliases: [`what's a`, `what's`, `who's`, 'show me'],
    description: 'i will show you'
}, (message) => {
    if (message.length === 0) {
        return false;
    }
    return got('http://images.google.com/search', {
        query: {
            q: message,
            tbm: 'isch',
            nfpr: 1 //exact search, don't correct typos
        },
        timeout: 5000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36'
        }
    })
        .then(res => {
        const $ = cheerio.load(res.body);
        const metaLinks = $('.rg_meta');
        const urls = [];
        metaLinks.each((i, el) => {
            if (el.children.length > 0 && 'data' in el.children[0]) {
                const metadata = JSON.parse(el.children[0].data);
                if (metadata.ou) {
                    urls.push(metadata.ou);
                }
            }
        });
        return util_1.randomInArray(urls.slice(0, 5));
    });
});
