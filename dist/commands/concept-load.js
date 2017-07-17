"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatter_1 = require("chatter");
const got = require("got");
const validator_1 = require("validator");
const concept_1 = require("../actions/concept");
const loaderRegex = /^([^ ]+) +(?:path[=: ]([\w\d.]+) +)?(?:as|to) +([^\s]+)$/;
const traverse = (obj, path) => {
    try {
        path.forEach(p => obj = obj[p]);
        return obj;
    }
    catch (e) { }
    return null;
};
exports.default = chatter_1.createCommand({
    name: 'load',
    aliases: ['json'],
    description: 'load a concept list from a url, overwriting existing concept if it exists'
}, (message, { store }) => {
    if (message.length === 0) {
        return false;
    }
    const matches = loaderRegex.exec(message);
    if (!matches) {
        return `*load* usage: [url] (path=path) as [concept]`;
    }
    const [, url, rawPath, concept] = matches;
    const path = rawPath.split('.');
    if (!validator_1.isURL(url)) {
        return `Error: '${url}' doesn't appear to be a valid URL.
      *load* usage: [url] (path=path) as [concept]`;
    }
    return got(url, { json: true })
        .then(({ body: json }) => {
        if (path) {
            const itemOrItems = traverse(json, path);
            if (!itemOrItems) {
                const validKeys = Object.keys(json).slice(0, 5).map(k => `'${k}'`).join(', ');
                throw new Error(`Invalid path: '${rawPath}'. Some valid keys: ${validKeys}...`);
            }
            if (Array.isArray(itemOrItems)) {
                return itemOrItems.map(i => i.toString());
            }
            const res = itemOrItems.toString();
            if (res === '[object Object]') {
                throw new Error(`Requested item does not appear to be a primitive or array! Aborting.`);
            }
            return [res];
        }
        if (Array.isArray(json)) {
            return json.map(i => i.toString());
        }
        const res = json.toString();
        if (res === '[object Object]') {
            throw new Error(`Requested item does not appear to be a primitive or array! Aborting.`);
        }
        return [res];
    })
        .then(items => {
        store.dispatch(concept_1.loadConceptAction(concept, items));
        return items.length;
    })
        .then(length => `Loaded ${length} items from ${url}.`)
        .catch(e => e);
});
