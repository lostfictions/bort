"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatter_1 = require("chatter");
const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");
const util_1 = require("../util");
const env_1 = require("../env");
const outputDirname = 'cliffs';
const outDir = path.join(__dirname, '../../static/', outputDirname);
if (!fs.existsSync(outDir)) {
    console.log(`Heathcliff output directory '${outDir}' not found! creating.`);
    fs.mkdirSync(outDir);
}
const imgDir = path.join(env_1.env.DATA_DIR, 'heathcliff');
let filenames = [];
if (!fs.existsSync(imgDir)) {
    console.error(`Heathcliff source directory '${imgDir}' not found! Heathcliff command will be unavailable.`);
}
else {
    filenames = fs.readdirSync(imgDir);
}
async function load(files) {
    const nextFiles = files.slice();
    let img;
    do {
        const fn = util_1.randomInArray(nextFiles);
        nextFiles.splice(nextFiles.indexOf(fn), 1);
        img = await Jimp.read(path.join(imgDir, fn));
    } while (img.bitmap.width > img.bitmap.height); // NO SUNDAYS
    return [img, nextFiles];
}
exports.default = chatter_1.createCommand({
    name: 'heathcliff',
    aliases: [`cliff`, `heath`, `bortcliff`, `borthcliff`],
    description: 'cliff composition'
}, (_, { store }) => {
    if (filenames.length === 0) {
        return false;
    }
    return new Promise((resolve, reject) => {
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
                        resolve(`http://${env_1.env.HOSTNAME}/${outputDirname}/${newFilename}.jpg`);
                    }
                });
            });
        });
    });
});
//# sourceMappingURL=heathcliff.js.map