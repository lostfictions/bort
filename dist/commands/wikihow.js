"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatter_1 = require("chatter");
const got = require("got");
const cheerio = require("cheerio");
const util_1 = require("../util");
const trace_1 = require("../components/trace");
function getRandomImage(body) {
    const imgs = cheerio.load(body)('img.whcdn').toArray()
        .map(img => img.attribs['data-src'])
        .filter(url => url); // only images with this attribute!
    return util_1.randomInArray(imgs);
}
async function search(term) {
    try {
        const res = await got('https://www.wikihow.com/wikiHowTo', { query: { search: term } });
        let topResult = cheerio
            .load(res.body)('a.result_link').toArray()
            .map(a => a.attribs.href)
            .find(url => !url.includes('Category:')); // first link that isn't a category
        if (topResult) {
            if (topResult.startsWith('//')) {
                topResult = 'https:' + topResult;
            }
            const wikiRes = await got(topResult);
            return getRandomImage(wikiRes.body);
        }
    }
    catch (e) { }
    return 'dunno how :(';
}
exports.default = chatter_1.createCommand({
    name: 'wikihow',
    aliases: [`how do i`, `how to`],
    description: 'learn anything'
}, (message, { store }) => {
    if (message.length === 0) {
        return got('https://www.wikihow.com/Special:Randomizer')
            .then(res => getRandomImage(res.body));
    }
    const maybeTraced = trace_1.tryTrace(message, store.getState().get('concepts'));
    if (maybeTraced) {
        return search(maybeTraced)
            .then(res => `(${maybeTraced})\n${res}`);
    }
    return search(message);
});
//# sourceMappingURL=wikihow.js.map