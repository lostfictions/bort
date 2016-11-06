"use strict";
function randomInArray(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
exports.randomInArray = randomInArray;
function randomInRange(collection) {
    return collection.get(Math.floor(Math.random() * collection.size));
}
exports.randomInRange = randomInRange;
function randomByWeight(weights) {
    const keys = Object.keys(weights);
    const sum = keys.reduce((p, c) => p + weights[c], 0);
    const choose = Math.floor(Math.random() * sum);
    for (let i = 0, count = 0; i < keys.length; i++) {
        count += weights[keys[i]];
        if (count > choose) {
            return keys[i];
        }
    }
    throw new Error('We goofed!');
}
exports.randomByWeight = randomByWeight;
