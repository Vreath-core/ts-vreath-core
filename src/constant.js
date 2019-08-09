"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const big_integer_1 = __importDefault(require("big-integer"));
const _ = __importStar(require("./util"));
let my_version = "0000";
let my_net_id = "004b";
let my_chain_id = "004b";
let compatible_version = "0000";
exports.constant = {
    my_version: my_version,
    my_net_id: my_net_id,
    my_chain_id: my_chain_id,
    native: "01",
    unit: "02",
    bitcoin: "03",
    ethereum: "04",
    block_time: 12,
    max_blocks: 9,
    block_size: 25000,
    all_issue: _.bigInt2hex(big_integer_1.default(10).pow(24)),
    cycle: 126144000,
    pow_target: _.bigInt2hex(big_integer_1.default(2).pow(256)),
    def_pos_diff: "246139ca8000",
    lwma_size: 8,
    unit_rate: 90,
    finalize_keyword: '66696e616c697a65',
    fault_tolerance: 66,
    finalize_size: 600,
    compatible_version: compatible_version,
    one_hex: "e8d4a51000"
};
exports.change_config = (config) => {
    exports.constant.my_version = config.my_version;
    exports.constant.my_net_id = config.my_net_id;
    exports.constant.my_chain_id = config.my_chain_id;
    exports.constant.compatible_version = config.compatible_version;
};
