"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const math = __importStar(require("mathjs"));
math.config({
    number: 'BigNumber'
});
const get_lwma = (times) => {
    const n = times.length;
    const denominator = math.chain(n).multiply(n + 1).divide(2).done();
    const numerator = times.reduce((res, time, i) => {
        return math.chain(n - i).multiply(time).add(res).done();
    }, 0);
    return math.chain(numerator).divide(denominator).done();
};
exports.get_diff = (diffs, target_time, solvetimes) => {
    const average = math.divide(diffs.reduce((sum, diff) => math.chain(sum).add(diff).done(), 0), diffs.length);
    const lwma = get_lwma(solvetimes);
    return math.chain(average).multiply(target_time).divide(lwma).done();
};
