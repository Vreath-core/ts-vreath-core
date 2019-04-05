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
const con = __importStar(require("./constant"));
math.config({
    number: 'BigNumber'
});
const size = con.constant.lwma_size;
const def_diff = con.constant.def_pos_diff;
exports.get_diff = (cumulative_diffs, target_time, solvetimes) => {
    if (cumulative_diffs.length != size + 1 || solvetimes.length != size + 1)
        return def_diff;
    let pre_time = math.chain(solvetimes[0]).subtract(target_time).done();
    let this_time = 0;
    let L = 0;
    let i;
    for (i = 1; i <= size; i++) {
        if (math.chain(solvetimes[i]).larger(pre_time).done())
            this_time = solvetimes[i];
        else
            this_time = math.chain(pre_time).add(1).done();
        L = math.chain(L).add(math.multiply(i, math.min(math.multiply(6, target_time), math.subtract(this_time, pre_time)))).done();
        pre_time = this_time;
    }
    if (math.chain(size).multiply(size).multiply(target_time).divide(20).larger(L).done())
        L = math.chain(size).multiply(size).multiply(target_time).divide(20).done();
    let avg_D = math.chain(cumulative_diffs[size]).subtract(cumulative_diffs[0]).divide(size).done();
    let next_D = 0;
    if (math.chain(2000000).multiply(size).multiply(size).multiply(target_time).smaller(avg_D).done())
        next_D = math.chain(avg_D).divide(200).divide(L).multiply(size).multiply(size + 1).multiply(target_time).multiply(99).done();
    else
        next_D = math.chain(avg_D).multiply(size).multiply(size + 1).multiply(target_time).multiply(99).divide(200).divide(L).done();
    return next_D;
};
