"use strict";
exports.__esModule = true;
var math = require("mathjs");
math.config({
    number: 'BigNumber'
});
var size = 300;
var def_diff = 1;
exports.get_diff = function (diffs, target_time, solvetimes) {
    if (diffs.length != size + 1 || solvetimes.length != size + 1)
        return def_diff;
    var pre_time = math.chain(solvetimes[0]).subtract(target_time).done();
    var this_time = 0;
    var L = 0;
    var i;
    for (i = 1; i <= size; i++) {
        if (math.chain(solvetimes[i]).larger(pre_time).done())
            this_time = solvetimes[i];
        else
            this_time = math.chain(pre_time).add(1).done();
        L = math.chain(L).add(math.min(math.multiply(6, solvetimes), math.subtract(this_time, pre_time))).done();
        pre_time = this_time;
    }
    if (math.chain(size).multiply(size).multiply(target_time).divide(20).larger(L).done())
        L = math.chain(size).multiply(size).multiply(target_time).divide(20).done();
    var avg_D = math.chain(diffs[size]).subtract(diffs[0]).divide(size).done();
    var next_D = 0;
    if (math.chain(2000000).multiply(size).multiply(size).multiply(target_time).smaller(avg_D))
        next_D = math.chain(avg_D).divide(200).divide(L).multiply(size).multiply(size + 1).multiply(target_time).multiply(99).done();
    else
        next_D = math.chain(avg_D).multiply(size).multiply(size).multiply(size + 1).multiply(target_time).multiply(99).divide(200).divide(L).done();
    return next_D;
};
