"use strict";
exports.__esModule = true;
var math = require("mathjs");
math.config({
    number: 'BigNumber'
});
var get_lwma = function (times) {
    var n = times.length;
    var denominator = math.chain(n).multiply(n + 1).divide(2).done();
    var numerator = times.reduce(function (res, time, i) {
        return math.chain(n - i).multiply(time).add(res).done();
    }, 0);
    return math.chain(numerator).divide(denominator).done();
};
exports.get_diff = function (diffs, target_time, solvetimes) {
    var average = math.divide(diffs.reduce(function (sum, diff) { return math.chain(sum).add(diff).done(); }, 0), diffs.length);
    var lwma = get_lwma(solvetimes);
    return math.chain(average).multiply(target_time).divide(lwma).done();
};
