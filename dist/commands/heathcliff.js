"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const chatter_1 = require('chatter');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const util_1 = require('../util/util');
const env_1 = require('../env');
const outputDirname = 'cliffs';
const outDir = path.join(__dirname, '../../static/', outputDirname);
if (!fs.existsSync(outDir)) {
    console.log(outDir + ' not found! creating.');
    fs.mkdirSync(outDir);
}
const imgDir = path.join(env_1.env.OPENSHIFT_DATA_DIR, 'heathcliff');
const filenames = fs.readdirSync(imgDir);
function load(files) {
    return __awaiter(this, void 0, void 0, function* () {
        const nextFiles = files.slice();
        let img;
        do {
            const fn = util_1.randomInArray(nextFiles);
            nextFiles.splice(nextFiles.indexOf(fn), 1);
            img = yield Jimp.read(path.join(imgDir, fn));
        } while (img.bitmap.width > img.bitmap.height); //NO SUNDAYS
        return [img, nextFiles];
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = chatter_1.createCommand({
    name: 'heathcliff',
    aliases: [`cliff`, `heath`, `bortcliff`, `borthcliff`],
    description: 'cliff composition'
}, (_, { store }) => new Promise((resolve, reject) => {
    load(filenames)
        .then(([i, nextFiles]) => {
        load(nextFiles).then(([j]) => {
            const [small, big] = i.bitmap.width < j.bitmap.width ? [i, j] : [j, i];
            big.resize(small.bitmap.width, Jimp.AUTO);
            i.blit(j, 0, i.bitmap.height * 0.9, 0, j.bitmap.height * 0.9, j.bitmap.width, j.bitmap.height * 0.1);
            const nouns = store.getState().get('concepts').get('noun');
            const newFilename = [util_1.randomInRange(nouns), util_1.randomInRange(nouns), util_1.randomInRange(nouns)].join('-');
            i.write(path.join(outDir, newFilename + '.jpg'), e => {
                if (e) {
                    reject(e);
                }
                else {
                    resolve('http://' + env_1.env.OPENSHIFT_APP_DNS + `/${outputDirname}/${newFilename}.jpg`);
                }
            });
        });
    });
}));
