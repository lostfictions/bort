"use strict";
const chatter_1 = require('chatter');
const got = require('got');
const cheerio = require('cheerio');
const util_1 = require('../util/util');
// based on https://github.com/jimkang/g-i-s/blob/master/index.js
const requestAndParse = (term, animated, exact) => got('http://images.google.com/search', {
    query: {
        q: term,
        tbm: 'isch',
        nfpr: exact ? 1 : 0,
        tbs: animated ? 'itp:animated' : undefined
    },
    timeout: 5000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36'
    }
}).then(res => {
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
    return urls;
});
const search = (term, animated = false) => requestAndParse(term, animated, true).then(res => {
    if (res.length === 0) {
        //if no results, try an inexact search
        return requestAndParse(term, animated, false);
    }
    return res;
}).then(res => {
    if (res.length === 0) {
        //if no results, try an inexact search
        return 'nothing :(';
    }
    return util_1.randomInArray(res.slice(0, 5));
});
exports.imageSearchCommand = chatter_1.createCommand({
    name: 'image',
    aliases: [`what's`, `who's`, `what is`, `who is`, `show me`],
    description: 'i will show you'
}, (message) => {
    if (message.length === 0) {
        return false;
    }
    return search(message);
});
exports.gifSearchCommand = chatter_1.createCommand({
    name: 'gifsearch',
    aliases: ['gif me the', 'gif me a', 'gif me', 'gif'],
    description: 'moving pictures'
}, (message) => {
    if (message.length === 0) {
        return false;
    }
    return search(message, true);
});
