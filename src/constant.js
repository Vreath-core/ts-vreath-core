"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const big_integer_1 = __importDefault(require("big-integer"));
let my_version = "0000";
let my_net_id = "004b";
let my_chain_id = "004b";
let compatible_version = "0000";
exports.constant = {
    my_version: my_version,
    my_net_id: my_net_id,
    my_chain_id: my_chain_id,
    native: "1",
    unit: "2",
    block_time: 12,
    max_blocks: 9,
    block_size: 25000,
    all_issue: big_integer_1.default(10).pow(24).toString(16),
    cycle: 126144000,
    pow_target: big_integer_1.default(2).pow(256).toString(16),
    def_pos_diff: 24,
    lwma_size: 8,
    unit_rate: 90,
    compatible_version: compatible_version
};
exports.change_config = (config) => {
    exports.constant.my_version = config.my_version;
    exports.constant.my_net_id = config.my_net_id;
    exports.constant.my_chain_id = config.my_chain_id;
    exports.constant.compatible_version = config.compatible_version;
};
