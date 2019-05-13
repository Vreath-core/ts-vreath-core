"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constant_1 = require("./constant");
const _ = __importStar(require("./util"));
const big_integer_1 = __importDefault(require("big-integer"));
const size = constant_1.constant.lwma_size;
const def_diff = constant_1.constant.def_pos_diff;
const target_time = constant_1.constant.block_time * (constant_1.constant.max_blocks + 1);
const get_lwma_infos = async (block_db, last_height) => {
    let blocks = [];
    let block = null;
    let height = big_integer_1.default(last_height, 16);
    while (height.notEquals(0)) {
        if (blocks.length >= size + 1)
            break;
        block = await block_db.read_obj(_.bigInt2hex(height));
        height = height.subtract(1);
        if (block == null || block.meta.kind != 0)
            continue;
        blocks.push(block);
    }
    const infos = blocks.reduce((res, block, i) => {
        res.times.push(block.meta.timestamp);
        res.cumulative_diffs.push(big_integer_1.default(res.cumulative_diffs[i - 1] || 0).add(big_integer_1.default(block.meta.pos_diff, 16)));
        return res;
    }, { times: [], cumulative_diffs: [] });
    return infos;
};
exports.get_diff = async (block_db, last_height) => {
    const info = await get_lwma_infos(block_db, last_height);
    const cumulative_diffs = info.cumulative_diffs;
    const solvetimes = info.times;
    if (cumulative_diffs.length != size + 1 || solvetimes.length != size + 1)
        return def_diff;
    let pre_time = big_integer_1.default(solvetimes[0]).subtract(target_time);
    let this_time = big_integer_1.default(0);
    let L = big_integer_1.default(0);
    let i;
    for (i = 1; i <= size; i++) {
        if (!big_integer_1.default(solvetimes[i]).lesserOrEquals(pre_time))
            this_time = big_integer_1.default(solvetimes[i]);
        else
            this_time = big_integer_1.default(pre_time).add(1);
        L = big_integer_1.default(L).add(big_integer_1.default(i).multiply(big_integer_1.default.min(big_integer_1.default(6).multiply(target_time), big_integer_1.default(this_time).subtract(pre_time))));
        pre_time = this_time;
    }
    if (!big_integer_1.default(size).multiply(size).multiply(target_time).divide(20).lesserOrEquals(L))
        L = big_integer_1.default(size).multiply(size).multiply(target_time).divide(20);
    let avg_D = big_integer_1.default(cumulative_diffs[size]).subtract(cumulative_diffs[0]).divide(size);
    let next_D = big_integer_1.default(0);
    if (big_integer_1.default(2000000).multiply(size).multiply(size).multiply(target_time).lesser(avg_D))
        next_D = big_integer_1.default(avg_D).divide(200).divide(L).multiply(size).multiply(size + 1).multiply(target_time).multiply(99);
    else
        next_D = big_integer_1.default(avg_D).multiply(size).multiply(size + 1).multiply(target_time).multiply(99).divide(200).divide(L);
    return _.bigInt2hex(next_D);
};
/*
const times = bigInt(constant.block_time).multiply(constant.max_blocks+1);

export const get_diff = (amount:string)=>{
    return _.bigInt2hex(bigInt(amount,16).multiply(times));
}
*/ 
